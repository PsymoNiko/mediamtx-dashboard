#!/usr/bin/env python3
import requests
import json
import time
import logging
import sys
from requests.auth import HTTPBasicAuth

# Configuration
MEDIAMTX_API_URL = "http://localhost:9997/v3/config/paths/list"
MEDIAMTX_CONFIG_PATH = "./mediamtx.yml"  # Update this to your actual path
MEDIAMTX_USERNAME = "admin"
MEDIAMTX_PASSWORD = "adminpass"
UPDATE_INTERVAL = 60  # seconds

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mediamtx_updater.log'),
        logging.StreamHandler()
    ]
)

def debug_response_structure(config_data):
    """Debug function to understand the response structure"""
    logging.info("=== DEBUG: Response Structure ===")
    logging.info(f"Type of config_data: {type(config_data)}")
    logging.info(f"Keys in config_data: {list(config_data.keys()) if isinstance(config_data, dict) else 'Not a dict'}")
    
    if isinstance(config_data, list):
        logging.info(f"Response is a list with {len(config_data)} items")
        if config_data:
            logging.info(f"First item type: {type(config_data[0])}")
            logging.info(f"First item keys: {list(config_data[0].keys()) if isinstance(config_data[0], dict) else 'Not a dict'}")
            logging.info(f"First item: {config_data[0]}")
    elif isinstance(config_data, dict):
        if 'items' in config_data:
            logging.info(f"'items' key found with {len(config_data['items'])} items")
            if config_data['items']:
                logging.info(f"First item in 'items': {config_data['items'][0]}")
    logging.info("=== END DEBUG ===")

def get_mediamtx_config():
    """Get current MediaMTX configuration via API"""
    try:
        logging.info(f"Attempting to connect to {MEDIAMTX_API_URL}")
        
        # Add authentication
        auth = HTTPBasicAuth(MEDIAMTX_USERNAME, MEDIAMTX_PASSWORD)
        response = requests.get(MEDIAMTX_API_URL, auth=auth, timeout=10)
        
        logging.info(f"Response status code: {response.status_code}")
        
        if response.status_code == 401:
            logging.error("Authentication failed - check username and password")
            return None
        elif response.status_code == 403:
            logging.error("Access forbidden - check user permissions")
            return None
        elif response.status_code != 200:
            logging.error(f"HTTP Error: {response.status_code} - {response.reason}")
            logging.error(f"Response text: {response.text}")
            return None
        
        # Check if response is actually JSON
        if not response.text.strip():
            logging.error("Empty response received")
            return None
            
        try:
            config_data = response.json()
            logging.info("Successfully parsed JSON response")
            
            # Debug the response structure
            debug_response_structure(config_data)
            
            return config_data
        except json.JSONDecodeError as e:
            logging.error(f"JSON decode error: {e}")
            logging.error(f"Response content: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError as e:
        logging.error(f"Connection error: {e}")
        logging.error("Make sure MediaMTX is running and API is enabled on port 9997")
    except requests.exceptions.Timeout as e:
        logging.error(f"Request timeout: {e}")
    except requests.exceptions.RequestException as e:
        logging.error(f"Request exception: {e}")
    except Exception as e:
        logging.error(f"Unexpected error in get_mediamtx_config: {e}")
    
    return None

def extract_paths_from_response(config_data):
    """Extract paths from the API response in various possible formats"""
    paths = {}
    
    # Case 1: Direct dictionary of paths
    if isinstance(config_data, dict) and 'paths' in config_data:
        paths = config_data['paths']
        logging.info("Found paths in 'paths' key")
    
    # Case 2: List of path items (common in v3 API)
    elif isinstance(config_data, list):
        logging.info("Response is a list, converting to paths dict")
        for item in config_data:
            if isinstance(item, dict) and 'name' in item:
                paths[item['name']] = item
        logging.info(f"Converted {len(paths)} paths from list")
    
    # Case 3: Items key containing paths
    elif isinstance(config_data, dict) and 'items' in config_data:
        logging.info("Found paths in 'items' key")
        for item in config_data['items']:
            if isinstance(item, dict) and 'name' in item:
                paths[item['name']] = item
        logging.info(f"Converted {len(paths)} paths from items")
    
    # Case 4: Direct path entries in root
    elif isinstance(config_data, dict):
        # Check if any keys look like path names and have source
        potential_paths = {}
        for key, value in config_data.items():
            if (isinstance(value, dict) and 
                'source' in value and 
                key not in ['all_others', 'paths', 'items']):
                potential_paths[key] = value
        
        if potential_paths:
            paths = potential_paths
            logging.info(f"Found {len(paths)} potential paths in root keys")
    
    # Log what we found
    if paths:
        logging.info(f"Extracted {len(paths)} paths:")
        for name, config in list(paths.items())[:5]:  # Show first 5
            source = config.get('source', 'No source')
            logging.info(f"  - {name}: {source}")
        if len(paths) > 5:
            logging.info(f"  ... and {len(paths) - 5} more paths")
    else:
        logging.info("No paths extracted from response")
    
    return paths

def update_mediamtx_config():
    """Update mediamtx.yml file with current paths"""
    try:
        # Get current config from API
        config_data = get_mediamtx_config()
        if not config_data:
            logging.error("No configuration data received from MediaMTX")
            return False
        
        # Extract paths using the new function
        paths = extract_paths_from_response(config_data)
        logging.info(f"Processing {len(paths)} paths")
        
        # Read existing config file
        try:
            with open(MEDIAMTX_CONFIG_PATH, 'r') as f:
                lines = f.readlines()
            logging.info(f"Successfully read config file: {MEDIAMTX_CONFIG_PATH}")
        except FileNotFoundError:
            logging.error(f"Config file not found: {MEDIAMTX_CONFIG_PATH}")
            return False
        except Exception as e:
            logging.error(f"Error reading config file: {e}")
            return False
        
        # Find the start and end of paths section
        paths_start = -1
        all_others_line = -1
        
        for i, line in enumerate(lines):
            if line.strip() == 'paths:':
                paths_start = i
                logging.info("Found 'paths:' at line {}".format(i))
            elif line.strip().startswith('all_others:') and paths_start != -1:
                all_others_line = i
                logging.info("Found 'all_others:' at line {}".format(i))
                break
        
        if paths_start == -1:
            logging.error("Could not find 'paths:' section in config file")
            return False
        if all_others_line == -1:
            logging.error("Could not find 'all_others:' section in config file")
            return False
        
        # Rebuild the file content
        new_lines = []
        
        # Keep everything before paths section
        new_lines.extend(lines[:paths_start + 1])
        
        # Add the camera paths (excluding all_others)
        added_paths = 0
        for path_name, path_config in paths.items():
            if path_name != 'all_others' and 'source' in path_config:
                new_lines.append(f"  {path_name}:\n")
                new_lines.append(f"    source: {path_config['source']}\n")
                # Add common settings
                #new_lines.append(f"    sourceOnDemand: yes\n")
                #new_lines.append(f"    sourceAnyPortEnable: yes\n\n")
                added_paths += 1
                logging.info(f"Added path: {path_name} -> {path_config['source']}")
        
        # Add everything from all_others onward
        new_lines.extend(lines[all_others_line:])
        
        # Write updated config
        try:
            with open(MEDIAMTX_CONFIG_PATH, 'w') as f:
                f.writelines(new_lines)
            logging.info(f"Successfully updated config file with {added_paths} paths")
            return True
        except Exception as e:
            logging.error(f"Error writing config file: {e}")
            return False
        
    except Exception as e:
        logging.error(f"Unexpected error in update_mediamtx_config: {e}")
        return False

def check_mediamtx_connectivity():
    """Check if we can connect to MediaMTX API"""
    try:
        # Add authentication to connectivity check
        auth = HTTPBasicAuth(MEDIAMTX_USERNAME, MEDIAMTX_PASSWORD)
        response = requests.get(MEDIAMTX_API_URL, auth=auth, timeout=5)
        
        if response.status_code == 200:
            logging.info("✓ Successfully connected to MediaMTX API")
            return True
        elif response.status_code == 401:
            logging.error("✗ Authentication failed - check username and password")
            return False
        elif response.status_code == 403:
            logging.error("✗ Access forbidden - check user permissions")
            return False
        else:
            logging.error(f"✗ MediaMTX API returned status: {response.status_code}")
            return False
    except Exception as e:
        logging.error(f"✗ Cannot connect to MediaMTX API: {e}")
        logging.error("Please ensure:")
        logging.error("1. MediaMTX is running")
        logging.error("2. API is enabled in mediamtx.yml (api: yes)")
        logging.error("3. API authentication is configured")
        logging.error("4. API port 9997 is accessible")
        return False

def main():
    logging.info("MediaMTX Configuration Updater started")
    logging.info(f"Using username: {MEDIAMTX_USERNAME}")
    
    # First, check connectivity
    if not check_mediamtx_connectivity():
        logging.error("Initial connectivity check failed. Exiting.")
        sys.exit(1)
    
    iteration = 0
    while True:
        iteration += 1
        logging.info(f"=== Update iteration {iteration} ===")
        
        success = update_mediamtx_config()
        if success:
            logging.info(f"Update completed successfully")
        else:
            logging.error(f"Update failed")
        
        logging.info(f"Waiting {UPDATE_INTERVAL} seconds until next update...")
        time.sleep(UPDATE_INTERVAL)

if __name__ == "__main__":
    main()
