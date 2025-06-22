# NFT Collection Creator Checklist (Python + dfx)

A concise, step-by-step guide for creators to launch and manage their NFT collection on the Internet Computer, using Python and dfx (no Rust CLI tool required).

---

## 1. Upload Your Media Files (Assets)
- **What:** Images, videos, or other media for your NFTs.
- **How:** Use a Python script or dfx to upload files to the canister's storage. Each file will get a URL (e.g., `http://<canister_id>.localhost:4943/images/myart.png`).
- **Why:** The NFT's metadata will reference this file as its image or media.

## 2. Create Metadata
- **What:** A JSON file describing each NFT, including:
  - `name`: NFT name
  - `description`: NFT description
  - `image`: URL to the uploaded file
  - `attributes`: Extra info (e.g., rarity, artist)
- **How:** Use a Python script to generate a template, or create manually. Example:
  ```json
  {
    "name": "My First NFT",
    "description": "A cool NFT",
    "image": "http://<canister_id>.localhost:4943/images/myart.png",
    "attributes": [
      {"trait_type": "Rarity", "value": "Legendary"}
    ]
  }
  ```
- **Why:** This is what wallets and marketplaces display for your NFT.

## 3. Upload Metadata
- **What:** Upload the metadata JSON to the canister.
- **How:** Use Python or dfx to upload the metadata file. The canister will store it and give you a metadata URL (e.g., `http://<canister_id>.localhost:4943/metadata/abc123.json`).
- **Why:** The NFT will reference this metadata URL.

## 4. Mint the NFT
- **What:** Create the NFT on the blockchain.
- **How:** Use Python or dfx to call the canister's mint function, providing:
  - The owner's principal
  - The metadata URL (or the metadata itself, depending on the canister)
- **Why:** This makes the NFT real and assigns it to an owner.

## 5. Verify
- **What:** Check that your NFT exists, has the right metadata, and is owned by the right person.
- **How:** Use Python or dfx to query the canister for token metadata and owner.

---

**Tip:**
- You can automate all these steps with Python scripts and dfx commands—no need for the Rust CLI tool.
- Ready to start? Move to step 1 and upload your first file! 