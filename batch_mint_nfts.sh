#!/usr/bin/env bash

set -euo pipefail

# Default config
CANISTER_IDS_FILE="canister_ids.json"
ASSETS_DIR="assets"
METADATA_DIR="metadata"
IDENTITY="${IDENTITY:-$HOME/.config/dfx/identity/bizkit/identity.pem}"
NETWORK="ic"
CMDLINE="target/release/origyn_icrc7_cmdlinetools"

# Parse canister ID from canister_ids.json
CANISTER_ID=$(jq -r '.core_nft.ic' "$CANISTER_IDS_FILE")

# Optionally allow overrides
while [[ $# -gt 0 ]]; do
  case $1 in
    --canister) CANISTER_ID="$2"; shift 2 ;;
    --identity) IDENTITY="$2"; shift 2 ;;
    --network) NETWORK="$2"; shift 2 ;;
    --assets) ASSETS_DIR="$2"; shift 2 ;;
    --metadata) METADATA_DIR="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

echo "Using canister: $CANISTER_ID"
echo "Using identity: $IDENTITY"
echo "Using network: $NETWORK"
echo "Assets dir: $ASSETS_DIR"
echo "Metadata dir: $METADATA_DIR"

echo "Files to process:" $ASSETS_DIR/*.png $ASSETS_DIR/*.jpg $ASSETS_DIR/*.jpeg

NFTS_MINTED=0
NFTS_SKIPPED=0

set +e
shopt -s nullglob
for img in $ASSETS_DIR/*.png $ASSETS_DIR/*.jpg $ASSETS_DIR/*.jpeg; do
  echo "Processing: $img"
  fname=$(basename "$img")
  base="${fname%.*}"
  meta="$METADATA_DIR/$base.json"

  if [[ ! -f "$meta" ]]; then
    echo "No metadata for $fname, skipping."
    ((NFTS_SKIPPED++))
    continue
  fi

  echo "Uploading image: $img"
  UPLOAD_OUT=$($CMDLINE --network "$NETWORK" --identity "$IDENTITY" --canister "$CANISTER_ID" upload-file "$img" "/images/$fname" 2>&1) || true
  if echo "$UPLOAD_OUT" | grep -q 'UploadAlreadyFinalized'; then
    echo "Image already uploaded and finalized, skipping upload."
  elif echo "$UPLOAD_OUT" | grep -q 'Error'; then
    echo "Error uploading image: $UPLOAD_OUT"
    ((NFTS_SKIPPED++))
    continue
  fi

  echo "Uploading metadata: $meta"
  $CMDLINE --network "$NETWORK" --identity "$IDENTITY" --canister "$CANISTER_ID" upload-metadata "$meta" 2>&1 || true
  HASH=$(sha256sum "$meta" | awk '{print $1}')
  META_URL="https://$CANISTER_ID.raw.icp0.io/${HASH}.json"
  echo "META_URL: $META_URL"
  if [[ -z "$META_URL" ]]; then
    echo "Failed to get metadata URL for $base, skipping mint."
    ((NFTS_SKIPPED++))
    continue
  fi
  echo "Minting NFT for $base with metadata URL: $META_URL"
  MINT_OUT=$($CMDLINE --network "$NETWORK" --identity "$IDENTITY" --canister "$CANISTER_ID" mint \
    --owner "$(dfx identity get-principal)" \
    --name "$base" \
    --metadata_url "$META_URL" \
    --memo "Batch minted NFT: $base" 2>&1) || true
  if echo "$MINT_OUT" | grep -qi 'Error\|already minted\|Duplicate'; then
    echo "Minting failed or already minted for $base: $MINT_OUT"
    ((NFTS_SKIPPED++))
    continue
  fi
  echo "$MINT_OUT"
  ((NFTS_MINTED++))
done
shopt -u nullglob
set -e

echo "Batch minting complete. Minted: $NFTS_MINTED, Skipped: $NFTS_SKIPPED." 