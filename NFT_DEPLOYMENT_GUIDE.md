# ICRC7/ICRC37 NFT Collection Deployment Guide

This guide provides a complete walkthrough for deploying and managing an NFT collection on the Internet Computer using the ICRC7/ICRC37 standard implementation.

## Project Overview

This repository contains a complete ICRC7/ICRC37 NFT implementation with:
- **Core NFT Canister**: Full ICRC7/ICRC37 standard implementation
- **Storage Canister**: High-performance asset storage solution
- **CLI Tools**: Command-line interface for NFT management
- **Production-ready**: Currently under review by DFINITY Foundation

## Prerequisites

### Required Tools
- **Internet Computer SDK (dfx)**: For canister deployment
- **Rust toolchain**: For building CLI tools
- **ic-wasm & candid-extractor**: For WASM optimization (already installed)

### Required Resources
- **Funded identity with cycles**: For canister deployment and operations
- **Principal ID**: Your identity's principal for authorization
- **Basic IC knowledge**: Understanding of canisters, cycles, and principals

## Environment Setup

### 1. Set Environment Variables
```bash
# Canister IDs (you'll get this after deployment)
export NFT_CANISTER_ID="YOUR_CANISTER_ID"

# Principals
export YOUR_PRINCIPAL_ID="YOUR_PRINCIPAL_ID"

# Configuration
export COLLECTION_NAME="MyCollection"
export COLLECTION_SYMBOL="MC"
export IDENTITY_FILE="identity.pem"
```

### 2. Get Your Principal ID
```bash
dfx identity get-principal
```

### 3. Export Your Identity
```bash
dfx identity export default > identity.pem
```

## Step 1: Build the Project

### Build Core NFT Canister
```bash
# Build the WASM file (this works fine)
bash ./scripts/build.sh
```

**Expected Output:**
- `src/core_nft/wasm/core_nft_canister.wasm.gz` (optimized WASM)
- `src/core_nft/wasm/can.did` (Candid interface)

### Build CLI Tool
```bash
cd cmdline
cargo build --release
```

**Expected Output:**
- `target/release/origyn_icrc7_cmdlinetools` (CLI executable)

## Step 2: Deploy the NFT Collection

### 1. Update canister_ids.json
```bash
# Replace with your actual canister ID after deployment
sed -i "s/YOUR_CANISTER_ID/$NFT_CANISTER_ID/g" example/canister_ids.json
```

### 2. Deploy to Internet Computer
```bash
dfx deploy --network ic nft --mode reinstall --argument '(
  variant { Init = record {
    supply_cap = null;
    tx_window = null;
    test_mode = true;
    default_take_value = null;
    max_canister_storage_threshold = null;
    logo = null;
    permitted_drift = null;
    name = "$COLLECTION_NAME";
    minting_authorities = vec { principal "$YOUR_PRINCIPAL_ID";};
    description = null;
    authorized_principals = vec { principal "$YOUR_PRINCIPAL_ID";};
    version = record { major = 0 : nat32; minor = 0 : nat32; patch = 0 : nat32;};
    max_take_value = null;
    max_update_batch_size = null;
    max_query_batch_size = null;
    commit_hash = "commit_hash";
    max_memo_size = null;
    atomic_batch_transfers = null;
    collection_metadata = vec {};
    symbol = "$COLLECTION_SYMBOL";
    approval_init = record {
      max_approvals_per_token_or_collection = opt (10 : nat);
      max_revoke_approvals = opt (10 : nat);
    };
  }
})'
```

**Important Notes:**
- The collection automatically manages storage canisters
- `test_mode = true` for testing purposes
- Replace `$YOUR_PRINCIPAL_ID` with your actual principal ID
- The canister will be deployed with your principal as both minting authority and authorized principal

## Step 3: Upload Assets

### Upload Image Files
```bash
# Upload an image to the collection
../target/release/origyn_icrc7_cmdlinetools \
  --network ic \
  --identity $IDENTITY_FILE \
  --canister $NFT_CANISTER_ID \
  upload-file ./your-image.png /images/your-image.png
```

**Options:**
- `--chunk_size`: Specify chunk size in bytes (default: 1MB)
- The tool shows upload progress with a progress bar

## Step 4: Create and Upload Metadata

### Interactive Metadata Creation
```bash
../target/release/origyn_icrc7_cmdlinetools \
  --network ic \
  --identity $IDENTITY_FILE \
  --canister $NFT_CANISTER_ID \
  create-metadata --output metadata.json --interactive
```

### CLI Metadata Creation
```bash
../target/release/origyn_icrc7_cmdlinetools \
  --network ic \
  --identity $IDENTITY_FILE \
  --canister $NFT_CANISTER_ID \
  create-metadata \
  --output metadata.json \
  --name "My NFT" \
  --description "A beautiful NFT" \
  --image "https://$NFT_CANISTER_ID.raw.icp0.io/images/your-image.png" \
  --attribute "Rarity:Legendary:boost_number" \
  --attribute "Power:95:number" \
  --attribute "Element:Fire"
```

### Validate Metadata
```bash
../target/release/origyn_icrc7_cmdlinetools \
  --network ic \
  --identity $IDENTITY_FILE \
  --canister $NFT_CANISTER_ID \
  validate-metadata metadata.json
```

### Upload Metadata
```bash
../target/release/origyn_icrc7_cmdlinetools \
  --network ic \
  --identity $IDENTITY_FILE \
  --canister $NFT_CANISTER_ID \
  upload-metadata metadata.json
```

This returns a metadata URL for minting.

## Step 5: Mint NFTs

### Method 1: Mint with Existing Metadata URL
```bash
../target/release/origyn_icrc7_cmdlinetools \
  --network ic \
  --identity $IDENTITY_FILE \
  --canister $NFT_CANISTER_ID \
  mint \
  --owner $YOUR_PRINCIPAL_ID \
  --name "My NFT" \
  --metadata_url "https://$NFT_CANISTER_ID.raw.icp0.io/abc123.json" \
  --memo "First NFT"
```

### Method 2: Create Metadata and Mint in One Step
```bash
../target/release/origyn_icrc7_cmdlinetools \
  --network ic \
  --identity $IDENTITY_FILE \
  --canister $NFT_CANISTER_ID \
  mint-with-metadata \
  --owner $YOUR_PRINCIPAL_ID \
  --name "My CLI NFT" \
  --description "Created via CLI" \
  --image "https://$NFT_CANISTER_ID.raw.icp0.io/images/your-image.png" \
  --attribute "Type:Legendary" \
  --attribute "Level:100:number" \
  --memo "CLI created NFT"
```

## Step 6: Verify Your NFTs

### Check Token Metadata
```bash
dfx canister call nft --network ic icrc7_token_metadata '(vec { 1 })'
```

### Check Token Owner
```bash
dfx canister call nft --network ic icrc7_owner_of '(vec { 1 })'
```

### Check Total Supply
```bash
dfx canister call nft --network ic icrc7_total_supply '()'
```

## ICRC97 Metadata Format

The tool creates metadata according to the ICRC97 standard:

```json
{
  "name": "NFT Name",
  "description": "NFT Description",
  "image": "https://example.com/image.png",
  "external_url": "https://example.com",
  "attributes": [
    {
      "trait_type": "Rarity",
      "value": "Legendary",
      "display_type": "boost_number"
    },
    {
      "trait_type": "Power",
      "value": 95,
      "display_type": "number"
    }
  ]
}
```

### Supported Display Types
- `number`: Regular number display
- `boost_number`: Number with + prefix
- `boost_percentage`: Percentage with + prefix
- `date`: Unix timestamp as date
- Custom display types are also supported

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure your identity is in the `authorized_principals` list
   - Check that you're using the correct identity file

2. **Invalid Metadata**
   - Use the `validate-metadata` command to check your JSON
   - Ensure all required fields are present

3. **Upload Failures**
   - Check network connectivity
   - Verify canister has sufficient cycles
   - Check file size and chunk size settings

4. **Minting Failures**
   - Verify you're in the `minting_authorities` list
   - Check that the metadata URL is accessible
   - Ensure the owner principal is valid

### Getting Help
```bash
# CLI tool help
../target/release/origyn_icrc7_cmdlinetools --help
../target/release/origyn_icrc7_cmdlinetools <subcommand> --help

# Canister status
dfx canister status nft --network ic
```

## Project Structure

```
nft/
├── src/core_nft/           # Core NFT canister implementation
├── cmdline/                # CLI tools for NFT management
├── scripts/                # Build and deployment scripts
├── example/                # Example configuration
└── integrations_tests/     # Test suite (currently has build issues)
```

## Key Features

- **Full ICRC7/ICRC37 Compliance**: Complete NFT standard implementation
- **Transaction History**: ICRC3 integration for transaction tracking
- **Flexible Storage**: Automatic storage canister management
- **Certified Responses**: All queries are certified for security
- **Production Ready**: Under review by DFINITY Foundation

## Next Steps

1. **Deploy your first collection** using this guide
2. **Test basic functionality** (mint, transfer, query)
3. **Explore advanced features** (approvals, batch operations)
4. **Consider fixing integration tests** for development confidence

## Resources

- [Internet Computer Documentation](https://internetcomputer.org/docs/current/developer-docs/)
- [ICRC-7 Standard](https://github.com/dfinity/ICRC-7)
- [ICRC97 Metadata Standard](https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-97/ICRC-97.md)
- [DFINITY Forum](https://forum.dfinity.org/) for community support 