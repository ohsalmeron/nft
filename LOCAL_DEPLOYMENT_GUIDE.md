# Local NFT Collection Deployment Guide

This guide walks you through deploying and testing the ICRC7/ICRC37 NFT collection locally using dfx, before deploying to the Internet Computer mainnet.

## Prerequisites

### Required Tools
- **Internet Computer SDK (dfx)**: For local canister deployment
- **Rust toolchain**: For building CLI tools
- **ic-wasm & candid-extractor**: For WASM optimization (already installed)

### Verify dfx Installation
```bash
dfx --version
```

If not installed, install it:
```bash
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
```

## Environment Setup

### 1. Set Environment Variables
```bash
# Local canister IDs (will be generated)
export NFT_CANISTER_ID=""

# Principals
export YOUR_PRINCIPAL_ID=""

# Configuration
export COLLECTION_NAME="MyLocalCollection"
export COLLECTION_SYMBOL="MLC"
export IDENTITY_FILE="identity.pem"
```

### 2. Get Your Principal ID
```bash
dfx identity get-principal
```

Copy the output and set it:
```bash
export YOUR_PRINCIPAL_ID="$(dfx identity get-principal)"
echo "Principal ID: $YOUR_PRINCIPAL_ID"
```

### 3. Export Your Identity
```bash
dfx identity export default > identity.pem
```

## Step 1: Build the Project

### Build Core NFT Canister
```bash
# Build the WASM file
bash ./scripts/build.sh
```

**Expected Output:**
- `src/core_nft/wasm/core_nft_canister.wasm.gz` (optimized WASM)
- `src/core_nft/wasm/can.did` (Candid interface)

### Build CLI Tool
```bash
cd cmdline
cargo build --release
cd ..
```

**Expected Output:**
- `cmdline/target/release/origyn_icrc7_cmdlinetools` (CLI executable)

## Troubleshooting: Generating can.did for the Storage (Asset) Canister

When working with the storage (asset) canister, you may encounter errors related to missing Candid files (can.did), especially when running `dfx generate` or deploying the frontend. For example:

```
Error: Failed while trying to generate type declarations for 'storage'.
Caused by: Candid file: /path/to/src/storage_canister/wasm/can.did doesn't exist.
```

Or for the frontend:
```
Error: Failed while trying to generate type declarations for 'frontend'.
Caused by: Candid file: /path/to/.dfx/local/canisters/frontend/assetstorage.did doesn't exist.
```

### Why does this happen?
- The build script or project setup may not generate the Candid file for the storage canister by default.
- The Candid file is required for generating type-safe bindings and for dfx to understand the canister interface.

### How to fix it (Storage Canister)
1. **Ensure you have the storage canister WASM built.**
   - You should have a file like `wasm/storage_canister.wasm` or similar.
2. **Create the expected output directory:**
   ```bash
   mkdir -p src/storage_canister/wasm
   ```
3. **Extract the Candid interface from the WASM using candid-extractor:**
   ```bash
   candid-extractor wasm/storage_canister.wasm > src/storage_canister/wasm/can.did
   ```
4. **Copy the gzipped WASM if needed:**
   ```bash
   cp wasm/storage_canister.wasm.gz src/storage_canister/wasm/storage_canister_canister.wasm.gz
   ```
5. **Run dfx generate again:**
   ```bash
   dfx generate
   ```
   This should now generate the required type declarations for the storage canister.

### How to fix it (Frontend Asset Canister)
- If you see errors about `assetstorage.did` for the frontend, it usually means the frontend assets canister hasn't been deployed locally, or the standard DFINITY asset canister Candid is missing.
- For most NFT projects, you can ignore this unless you need to interact with the asset canister programmatically from your frontend code.
- If you want to fix it, deploy the frontend canister locally with:
   ```bash
   dfx deploy frontend
   ```
  or copy the standard asset canister Candid file to the expected location.

### General Advice
- Always make sure your Candid files are up to date and match your deployed WASM.
- If you change your canister interface, regenerate the Candid and rerun `dfx generate`.
- If you see missing function errors in your frontend (e.g., `TypeError: mainnetActor.icrc7_tokens is not a function`), check that your Candid file actually contains the method and that your declarations are up to date.

## Step 2: Start Local Internet Computer

### Start dfx
```bash
# Start the local IC replica
dfx start --background --clean

# Wait a moment for it to fully start
sleep 5

# Check status
dfx ping
```

**Expected Output:**
```
{
  "ic_api_version": "0.18.0"  "impl_hash": "..."  "impl_version": "..."  "replica_health_status": "healthy"  "root_key": "..."
}
```

## Step 3: Deploy Locally

### 1. Deploy the NFT Canister
```bash
dfx deploy nft --mode reinstall --argument '(
  variant { Init = record {
    supply_cap = null;
    tx_window = null;
    test_mode = true;
    default_take_value = null;
    max_canister_storage_threshold = null;
    logo = null;
    permitted_drift = null;
    name = "MyLocalCollection";
    minting_authorities = vec { principal "'$YOUR_PRINCIPAL_ID'";};
    description = null;
    authorized_principals = vec { principal "'$YOUR_PRINCIPAL_ID'";};
    version = record { major = 0 : nat32; minor = 0 : nat32; patch = 0 : nat32;};
    max_take_value = null;
    max_update_batch_size = null;
    max_query_batch_size = null;
    commit_hash = "local_development";
    max_memo_size = null;
    atomic_batch_transfers = null;
    collection_metadata = vec {};
    symbol = "MLC";
    approval_init = record {
      max_approvals_per_token_or_collection = opt (10 : nat);
      max_revoke_approvals = opt (10 : nat);
    };
  }
})'
```

### 2. Get the Canister ID
```bash
export NFT_CANISTER_ID="$(dfx canister id nft)"
echo "NFT Canister ID: $NFT_CANISTER_ID"
```

### 3. Update canister_ids.json
```bash
# Update the local canister IDs file
cat > example/canister_ids.json << EOF
{
  "nft": {
    "local": "$NFT_CANISTER_ID"
  }
}
EOF
```

## Step 4: Test Basic Functionality

### Check Canister Status
```bash
dfx canister status nft
```

### Test Collection Metadata
```bash
dfx canister call nft icrc7_name '()'
dfx canister call nft icrc7_symbol '()'
dfx canister call nft icrc7_total_supply '()'
```

**Expected Output:**
```
("MyLocalCollection")
("MLC")
(0 : nat)
```

## Step 5: Upload Test Assets

### Create a Test Image
```bash
# Create a simple test image (if you don't have one)
convert -size 100x100 xc:red test-image.png
# Or copy an existing image
# cp /path/to/your/image.png test-image.png
```

### Upload Image
```bash
cmdline/target/release/origyn_icrc7_cmdlinetools \
  --network local \
  --identity $IDENTITY_FILE \
  --canister $NFT_CANISTER_ID \
  upload-file ./test-image.png /images/test-image.png
```

## Step 6: Create and Upload Metadata

### Create Metadata
```bash
cmdline/target/release/origyn_icrc7_cmdlinetools \
  --network local \
  --identity $IDENTITY_FILE \
  --canister $NFT_CANISTER_ID \
  create-metadata \
  --output metadata.json \
  --name "Local Test NFT" \
  --description "A test NFT for local development" \
  --image "http://$NFT_CANISTER_ID.localhost:4943/images/test-image.png" \
  --attribute "Environment:Local" \
  --attribute "Test:true"
```

### Validate Metadata
```bash
cmdline/target/release/origyn_icrc7_cmdlinetools \
  --network local \
  --identity $IDENTITY_FILE \
  --canister $NFT_CANISTER_ID \
  validate-metadata metadata.json
```

### Upload Metadata
```bash
cmdline/target/release/origyn_icrc7_cmdlinetools \
  --network local \
  --identity $IDENTITY_FILE \
  --canister $NFT_CANISTER_ID \
  upload-metadata metadata.json
```

## Step 7: Mint Test NFTs

### Mint with Metadata
```bash
cmdline/target/release/origyn_icrc7_cmdlinetools \
  --network local \
  --identity $IDENTITY_FILE \
  --canister $NFT_CANISTER_ID \
  mint-with-metadata \
  --owner $YOUR_PRINCIPAL_ID \
  --name "Local Test NFT" \
  --description "Created for local testing" \
  --image "http://$NFT_CANISTER_ID.localhost:4943/images/test-image.png" \
  --attribute "Type:Test" \
  --attribute "Number:1" \
  --memo "Local test mint"
```

## Step 8: Verify Local NFTs

### Check Token Metadata
```bash
dfx canister call nft icrc7_token_metadata '(vec { 1 })'
```

### Check Token Owner
```bash
dfx canister call nft icrc7_owner_of '(vec { 1 })'
```

### Check Total Supply
```bash
dfx canister call nft icrc7_total_supply '()'
```

### List All Tokens
```bash
dfx canister call nft icrc7_tokens '(null, null)'
```

## Step 9: Test Advanced Features

### Test Transfer (if you have multiple identities)
```bash
# Create a second identity for testing
dfx identity new test-user
dfx identity use test-user
export TEST_USER_PRINCIPAL="$(dfx identity get-principal)"

# Switch back to default identity
dfx identity use default

# Transfer token (if you have token ID 1)
dfx canister call nft icrc7_transfer '(vec { record {
  to = record { owner = principal "'$TEST_USER_PRINCIPAL'"; subaccount = null };
  token_id = 1;
  memo = null;
  from_subaccount = null;
  created_at_time = null;
}})'
```

### Test Approvals
```bash
# Approve a token for transfer
dfx canister call nft icrc37_approve_tokens '(vec { record {
  token_id = 1;
  approval_info = record {
    spender = record { owner = principal "'$TEST_USER_PRINCIPAL'"; subaccount = null };
    from_subaccount = null;
    expires_at = null;
    memo = null;
    created_at_time = 0;
  };
}})'
```

## Useful dfx Commands

### Canister Management
```bash
# List all canisters
dfx canister list

# Get canister info
dfx canister info nft

# Check canister cycles
dfx canister status nft

# Stop canister
dfx canister stop nft

# Start canister
dfx canister start nft

# Delete canister
dfx canister delete nft
```

### Identity Management
```bash
# List identities
dfx identity list

# Switch identity
dfx identity use <identity-name>

# Get current identity
dfx identity whoami

# Get principal of current identity
dfx identity get-principal
```

### Network Management
```bash
# Check local network status
dfx ping

# Stop local network
dfx stop

# Start local network
dfx start --background
```

## Troubleshooting Local Deployment

### Common Issues

1. **dfx not found**
   ```bash
   # Install dfx
   sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
   ```

2. **Port already in use**
   ```bash
   # Stop existing dfx processes
   dfx stop
   # Or kill the process
   pkill -f dfx
   ```

3. **Canister deployment fails**
   ```bash
   # Check dfx status
   dfx ping
   
   # Restart with clean state
   dfx stop
   dfx start --background --clean
   ```

4. **CLI tool fails to connect**
   ```bash
   # Ensure you're using --network local
   # Check canister ID is correct
   dfx canister id nft
   ```

### Reset Everything
```bash
# Stop dfx
dfx stop

# Clean everything
dfx start --background --clean

# Redeploy
dfx deploy nft --mode reinstall --argument '...'
```

## Next Steps After Local Testing

1. **Verify all functionality works locally**
2. **Test with multiple identities**
3. **Try different NFT configurations**
4. **When ready, follow the main deployment guide for IC mainnet**

## Local vs Mainnet Differences

| Feature | Local | Mainnet |
|---------|-------|---------|
| Network | `--network local` | `--network ic` |
| URL | `http://canister.localhost:4943` | `https://canister.raw.icp0.io` |
| Cycles | Free | Requires ICP |
| Speed | Instant | Network dependent |
| Persistence | Temporary | Permanent |

## Cleanup

When you're done testing:
```bash
# Stop the local network
dfx stop

# Remove local state (optional)
rm -rf .dfx/
```

This local deployment gives you a safe environment to test everything before deploying to mainnet!

## Tested: Deploy core_nft Canister with Correct Candid Arguments

You can use the following command to deploy the `core_nft` canister locally with a generic NFT collection configuration. This command uses the correct Candid argument syntax (fields separated by semicolons) and will work in your terminal:

```bash
export YOUR_PRINCIPAL_ID="$(dfx identity get-principal)"
dfx deploy core_nft --mode reinstall --argument '(
  variant { Init = record {
    supply_cap = null;
    tx_window = null;
    test_mode = true;
    default_take_value = null;
    max_canister_storage_threshold = null;
    logo = null;
    permitted_drift = null;
    name = "GenericNFTCollection";
    minting_authorities = vec { principal "'$YOUR_PRINCIPAL_ID'" };
    description = null;
    authorized_principals = vec { principal "'$YOUR_PRINCIPAL_ID'" };
    version = record { major = 0 : nat32; minor = 0 : nat32; patch = 0 : nat32 };
    max_take_value = null;
    max_update_batch_size = null;
    max_query_batch_size = null;
    commit_hash = "local_development";
    max_memo_size = null;
    atomic_batch_transfers = null;
    collection_metadata = vec {};
    symbol = "GNFT";
    approval_init = record {
      max_approvals_per_token_or_collection = opt (10 : nat);
      max_revoke_approvals = opt (10 : nat)
    }
  }
})'
```

**How to use:**
1. Make sure your local Internet Computer is running (`dfx start --background --clean`).
2. Run the above command in your terminal.
3. This will deploy the canister with a generic configuration for local testing. 
4. rustup target add wasm32-unknown-unknown
5. cargo install ic-wasm candid-extractor
6. export PATH="$HOME/.cargo/bin:$PATH" 