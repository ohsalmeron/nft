#!/usr/bin/env bash

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."
METADATA_DIR="$PROJECT_ROOT/metadata"
ASSETS_DIR="$PROJECT_ROOT/assets"

# Loop through all JSON files in metadata directory
for json_file in "$METADATA_DIR"/*.json; do
    # Extract the image filename from the JSON (assumes the field is always present and formatted as in the examples)
    image_path=$(jq -r '.image' "$json_file" | awk -F'/' '{print $NF}')
    # Check if the image file exists in the assets directory
    if [[ ! -f "$ASSETS_DIR/$image_path" ]]; then
        echo "Deleting $json_file (missing asset: $image_path)"
        rm "$json_file"
    fi
done 