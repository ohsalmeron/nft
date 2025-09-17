#!/bin/bash

set -euo pipefail

# Cosmicrafts Genesis Collection Deployment Script
# This script deploys the Genesis collection locally and mints all NFTs

echo "🚀 Cosmicrafts Genesis Collection Deployment"
echo "=============================================="

# Configuration
COLLECTION_NAME="Cosmicrafts Genesis"
COLLECTION_SYMBOL="CGEN"
IDENTITY_FILE="identity.pem"
NETWORK="local"  # Change to "ic" for mainnet

# Get principal ID
export YOUR_PRINCIPAL_ID="$(dfx identity get-principal)"
echo "Principal ID: $YOUR_PRINCIPAL_ID"

# Export identity if not exists
if [ ! -f "$IDENTITY_FILE" ]; then
    echo "📝 Exporting identity..."
    dfx identity export default > "$IDENTITY_FILE"
fi

# Build the project
echo "🔨 Building project..."
bash ./scripts/build.sh

# Build CLI tool
echo "🔧 Building CLI tool..."
cd cmdline
cargo build --release
cd ..

# Start local IC if not running
echo "🌐 Starting local Internet Computer..."
if ! dfx ping > /dev/null 2>&1; then
    dfx start --background --clean
    sleep 10
    echo "✅ Local IC started"
else
    echo "✅ Local IC already running"
fi

# Deploy Genesis collection
echo "🚀 Deploying Genesis collection..."
dfx deploy core_nft --mode reinstall --argument "(
  variant { Init = record {
    supply_cap = null;
    tx_window = null;
    test_mode = true;
    default_take_value = null;
    max_canister_storage_threshold = null;
    logo = null;
    permitted_drift = null;
    name = \"$COLLECTION_NAME\";
    minting_authorities = vec { principal \"$YOUR_PRINCIPAL_ID\" };
    description = null;
    authorized_principals = vec { principal \"$YOUR_PRINCIPAL_ID\" };
    version = record { major = 0 : nat32; minor = 0 : nat32; patch = 0 : nat32 };
    max_take_value = null;
    max_update_batch_size = null;
    max_query_batch_size = null;
    commit_hash = \"genesis_migration\";
    max_memo_size = null;
    atomic_batch_transfers = null;
    collection_metadata = vec {};
    symbol = \"$COLLECTION_SYMBOL\";
    approval_init = record {
      max_approvals_per_token_or_collection = opt (10 : nat);
      max_revoke_approvals = opt (10 : nat)
    }
  }
})"

# Get canister ID
export NFT_CANISTER_ID="$(dfx canister id core_nft)"
echo "🎯 NFT Canister ID: $NFT_CANISTER_ID"

# Update canister_ids.json
echo "📝 Updating canister IDs..."
cat > canister_ids.json << EOF
{
  "core_nft": {
    "local": "$NFT_CANISTER_ID"
  }
}
EOF

# Check if Genesis images exist
if [ ! -d "../Genesis" ]; then
    echo "❌ Genesis directory not found at ../Genesis"
    echo "Please ensure your Genesis images are in the ../Genesis folder"
    exit 1
fi

# Check if Ollama is running
echo "🤖 Checking Ollama status..."
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "❌ Ollama is not running on Windows"
    echo "Please start Ollama on Windows: ollama serve"
    echo "And pull the model: ollama pull qwen2.5vl"
    exit 1
fi

# Check if qwen2.5vl model is available
if ! ollama list | grep -q "qwen2.5vl"; then
    echo "📥 Pulling qwen2.5vl model..."
    ollama pull qwen2.5vl
fi

echo "✅ Ollama is ready"

# Run the Genesis migration pipeline
echo "🔄 Running Genesis migration pipeline..."
cd scripts
python3 genesis_migration.py
cd ..

# Check if assets and metadata were generated
if [ ! -d "assets" ] || [ ! -d "metadata" ]; then
    echo "❌ Assets or metadata directories not found"
    echo "Check the migration log: scripts/genesis_process.log"
    exit 1
fi

# Count generated files
ASSET_COUNT=$(ls assets/*.webp 2>/dev/null | wc -l)
METADATA_COUNT=$(ls metadata/*.json 2>/dev/null | wc -l)

echo "📊 Generated files:"
echo "   Assets: $ASSET_COUNT WebP files"
echo "   Metadata: $METADATA_COUNT JSON files"

if [ "$ASSET_COUNT" -eq 0 ] || [ "$METADATA_COUNT" -eq 0 ]; then
    echo "❌ No assets or metadata generated"
    echo "Check the migration log: scripts/genesis_process.log"
    exit 1
fi

# Upload assets to canister
echo "📤 Uploading assets to canister..."
for webp_file in assets/*.webp; do
    filename=$(basename "$webp_file")
    echo "   Uploading $filename..."
    cmdline/target/release/origyn_icrc7_cmdlinetools \
        --network "$NETWORK" \
        --identity "$IDENTITY_FILE" \
        --canister "$NFT_CANISTER_ID" \
        upload-file "$webp_file" "/images/$filename" || true
done

# Upload metadata and mint NFTs
echo "🎨 Uploading metadata and minting NFTs..."
for json_file in metadata/*.json; do
    base_name=$(basename "$json_file" .json)
    webp_file="assets/${base_name}.webp"
    
    if [ -f "$webp_file" ]; then
        echo "   Processing $base_name..."
        
        # Upload metadata
        cmdline/target/release/origyn_icrc7_cmdlinetools \
            --network "$NETWORK" \
            --identity "$IDENTITY_FILE" \
            --canister "$NFT_CANISTER_ID" \
            upload-metadata "$json_file" || true
        
        # Get metadata URL
        HASH=$(sha256sum "$json_file" | awk '{print $1}')
        META_URL="http://$NFT_CANISTER_ID.localhost:4943/${HASH}.json"
        
        # Extract mint number from filename
        MINT_NUMBER=$(echo "$base_name" | grep -o '[0-9]\+')
        
        # Mint NFT
        cmdline/target/release/origyn_icrc7_cmdlinetools \
            --network "$NETWORK" \
            --identity "$IDENTITY_FILE" \
            --canister "$NFT_CANISTER_ID" \
            mint \
            --owner "$YOUR_PRINCIPAL_ID" \
            --name "$base_name" \
            --metadata_url "$META_URL" \
            --memo "Genesis NFT #$MINT_NUMBER" || true
    fi
done

# Verify collection
echo "🔍 Verifying collection..."
TOTAL_SUPPLY=$(dfx canister call core_nft icrc7_total_supply '()' | grep -o '[0-9]\+')
echo "✅ Total NFTs minted: $TOTAL_SUPPLY"

# Display collection info
echo ""
echo "🎉 Cosmicrafts Genesis Collection Deployed Successfully!"
echo "========================================================"
echo "Collection Name: $COLLECTION_NAME"
echo "Collection Symbol: $COLLECTION_SYMBOL"
echo "Canister ID: $NFT_CANISTER_ID"
echo "Total Supply: $TOTAL_SUPPLY"
echo "Network: $NETWORK"
echo ""
echo "🌐 View your collection at:"
echo "   http://$NFT_CANISTER_ID.localhost:4943"
echo ""
echo "📋 Next steps:"
echo "   1. Test the collection functionality"
echo "   2. When ready for mainnet, change NETWORK to 'ic'"
echo "   3. Deploy to mainnet with funded cycles"
echo ""
echo "📁 Generated files:"
echo "   Assets: assets/ (WebP files)"
echo "   Metadata: metadata/ (JSON files)"
echo "   Log: scripts/genesis_process.log"
