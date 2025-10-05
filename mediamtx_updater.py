#!/usr/bin/env python3
import os
import sys
import time
import json
import logging
import requests
from requests.auth import HTTPBasicAuth

# -------------------------------------------------
# Configuration – values can be overridden by env vars
# -------------------------------------------------
MEDIAMTX_HOST = os.getenv("MEDIAMTX_HOST", "localhost")
MEDIAMTX_API_URL = f"http://{MEDIAMTX_HOST}:9997/v3/config/paths/list"

# Path to the local MediaMTX yaml file
MEDIAMTX_CONFIG_PATH = os.getenv(
    "MEDIAMTX_CONFIG_PATH", "./mediamtx.yml"
)

# Basic‑auth credentials (also overridable)
MEDIAMTX_USERNAME = os.getenv("MEDIAMTX_USERNAME", "admin")
MEDIAMTX_PASSWORD = os.getenv("MEDIAMTX_PASSWORD", "adminpass")

# How often we poll the API (seconds)
UPDATE_INTERVAL = int(os.getenv("UPDATE_INTERVAL", "60"))

# -------------------------------------------------
# Logging
# -------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("mediamtx_updater.log"),
        logging.StreamHandler(),
    ],
)

# -------------------------------------------------
# Helper: show the shape of the API response
# -------------------------------------------------
def debug_response_structure(config_data):
    logging.info("=== DEBUG: Response Structure ===")
    logging.info(f"type: {type(config_data)}")
    if isinstance(config_data, dict):
        logging.info(f"keys: {list(config_data.keys())}")
    elif isinstance(config_data, list):
        logging.info(f"list length: {len(config_data)}")
        if config_data:
            logging.info(f"first item type: {type(config_data[0])}")
            if isinstance(config_data[0], dict):
                logging.info(f"first item keys: {list(config_data[0].keys())}")
    logging.info("=== END DEBUG ===")


# -------------------------------------------------
# 1️⃣ Get current MediaMTX configuration via API
# -------------------------------------------------
def get_mediamtx_config():
    try:
        logging.info(f"Connecting to {MEDIAMTX_API_URL}")
        auth = HTTPBasicAuth(MEDIAMTX_USERNAME, MEDIAMTX_PASSWORD)
        resp = requests.get(MEDIAMTX_API_URL, auth=auth, timeout=10)

        logging.info(f"HTTP {resp.status_code}")
        if resp.status_code == 401:
            logging.error("Authentication failed")
            return None
        if resp.status_code != 200:
            logging.error(f"Unexpected status: {resp.status_code} – {resp.text}")
            return None

        if not resp.text.strip():
            logging.error("Empty response")
            return None

        data = resp.json()
        logging.info("JSON parsed successfully")
        debug_response_structure(data)
        return data

    except requests.exceptions.RequestException as e:
        logging.error(f"Request error: {e}")
    except json.JSONDecodeError as e:
        logging.error(f"JSON decode error: {e}")
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
    return None


# -------------------------------------------------
# 2️⃣ Extract the path dictionary from the API payload
# -------------------------------------------------
def extract_paths_from_response(config_data):
    paths = {}

    # ── case 1: {"paths": {...}}
    if isinstance(config_data, dict) and "paths" in config_data:
        paths = config_data["paths"]
        logging.info("Found paths under 'paths' key")

    # ── case 2: list of items [{name:..., source:...}, …]
    elif isinstance(config_data, list):
        logging.info("Response is a list – converting")
        for item in config_data:
            if isinstance(item, dict) and "name" in item:
                paths[item["name"]] = item

    # ── case 3: {"items": [...]}
    elif isinstance(config_data, dict) and "items" in config_data:
        logging.info("Found paths under 'items' key")
        for item in config_data["items"]:
            if isinstance(item, dict) and "name" in item:
                paths[item["name"]] = item

    # ── case 4: root keys that look like paths
    elif isinstance(config_data, dict):
        for k, v in config_data.items():
            if isinstance(v, dict) and "source" in v and k not in ("paths", "items", "all_others"):
                paths[k] = v
        if paths:
            logging.info("Found potential paths in root keys")

    logging.info(f"Extracted {len(paths)} paths")
    for name, cfg in list(paths.items())[:5]:
        logging.info(f"  - {name}: {cfg.get('source', 'no source')}")
    if len(paths) > 5:
        logging.info(f"  … and {len(paths)-5} more")
    return paths


# -------------------------------------------------
# 3️⃣ Write the paths back into mediamtx.yml
# -------------------------------------------------
def update_mediamtx_config():
    config_data = get_mediamtx_config()
    if not config_data:
        logging.error("No data from API")
        return False

    paths = extract_paths_from_response(config_data)

    # ---- read existing yaml ----
    try:
        with open(MEDIAMTX_CONFIG_PATH, "r") as f:
            lines = f.readlines()
        logging.info(f"Read {MEDIAMTX_CONFIG_PATH}")
    except FileNotFoundError:
        logging.error(f"File not found: {MEDIAMTX_CONFIG_PATH}")
        return False
    except Exception as e:
        logging.error(f"Read error: {e}")
        return False

    # ---- locate sections ----
    paths_start = -1
    all_others_line = -1
    for i, line in enumerate(lines):
        if line.strip() == "paths:":
            paths_start = i
        elif line.strip().startswith("all_others:") and paths_start != -1:
            all_others_line = i
            break

    if paths_start == -1 or all_others_line == -1:
        logging.error("Could not locate 'paths:' or 'all_others:' in yaml")
        return False

    # ---- rebuild yaml ----
    new_lines = []
    new_lines.extend(lines[: paths_start + 1])  # keep header

    added = 0
    for name, cfg in paths.items():
        if name == "all_others" or "source" not in cfg:
            continue
        new_lines.append(f"  {name}:\n")
        new_lines.append(f"    source: {cfg['source']}\n")
        added += 1
        logging.info(f"Added {name} → {cfg['source']}")

    new_lines.extend(lines[all_others_line:])  # keep the rest

    # ---- write back ----
    try:
        with open(MEDIAMTX_CONFIG_PATH, "w") as f:
            f.writelines(new_lines)
        logging.info(f"Wrote {added} paths to {MEDIAMTX_CONFIG_PATH}")
        return True
    except Exception as e:
        logging.error(f"Write error: {e}")
        return False


# -------------------------------------------------
# 4️⃣ Simple connectivity test (auth included)
# -------------------------------------------------
def check_mediamtx_connectivity():
    try:
        auth = HTTPBasicAuth(MEDIAMTX_USERNAME, MEDIAMTX_PASSWORD)
        resp = requests.get(MEDIAMTX_API_URL, auth=auth, timeout=5)
        if resp.status_code == 200:
            logging.info("✓ API reachable")
            return True
        logging.error(f"API returned {resp.status_code}")
    except Exception as e:
        logging.error(f"Connectivity error: {e}")
    return False


# -------------------------------------------------
# Main loop
# -------------------------------------------------
def main():
    logging.info("=== MediaMTX updater started ===")
    logging.info(f"Host: {MEDIAMTX_HOST}")
    logging.info(f"User: {MEDIAMTX_USERNAME}")

    if not check_mediamtx_connectivity():
        logging.error("Initial connectivity failed – aborting")
        sys.exit(1)

    iteration = 0
    while True:
        iteration += 1
        logging.info(f"--- iteration {iteration} ---")
        if update_mediamtx_config():
            logging.info("Update succeeded")
        else:
            logging.error("Update failed")
        logging.info(f"Sleeping {UPDATE_INTERVAL}s")
        time.sleep(UPDATE_INTERVAL)


if __name__ == "__main__":
    main()
