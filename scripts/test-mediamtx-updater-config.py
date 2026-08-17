#!/usr/bin/env python3
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "mediamtx_updater.py"

spec = importlib.util.spec_from_file_location("mediamtx_updater_under_test", MODULE_PATH)
mediamtx_updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mediamtx_updater)

assert (
    mediamtx_updater.build_mediamtx_paths_url("http://publisher:9997")
    == "http://publisher:9997/v3/config/paths/list"
)
assert (
    mediamtx_updater.build_mediamtx_paths_url("http://publisher:9997/")
    == "http://publisher:9997/v3/config/paths/list"
)
assert (
    mediamtx_updater.build_mediamtx_paths_url("http://publisher:9997/v3/config/paths/list")
    == "http://publisher:9997/v3/config/paths/list"
)
assert (
    mediamtx_updater.build_mediamtx_paths_url("http://publisher:9997/v3/config")
    == "http://publisher:9997/v3/config/paths/list"
)
assert (
    mediamtx_updater.build_mediamtx_paths_url("http://publisher:9997/v3")
    == "http://publisher:9997/v3/config/paths/list"
)
assert mediamtx_updater.build_mediamtx_paths_url(None) == "http://localhost:9997/v3/config/paths/list"
assert mediamtx_updater.build_mediamtx_paths_url("   ") == "http://localhost:9997/v3/config/paths/list"

assert mediamtx_updater.parse_update_interval("5") == 5
assert mediamtx_updater.parse_update_interval("0") == 60
assert mediamtx_updater.parse_update_interval("-1") == 60
assert mediamtx_updater.parse_update_interval("not-a-number") == 60
