# Internet Computer NFT Marketplace — Technical Feature Specification

## Executive Summary

- **Comprehensive NFT Marketplace**: Feature-rich platform for browsing, trading, and managing NFTs on the Internet Computer, inspired by OpenSea.
- **Advanced Collection & NFT Browsing**: Powerful filters, analytics, and multiple view modes for seamless discovery.
- **On-chain & Off-chain Data Integration**: Real-time blockchain data (ownership, listings, offers) combined with indexed metadata and analytics.
- **Creator Tools**: Full workflow for launching collections, uploading assets, and generating/validating metadata, including AI-powered utilities for batch processing.
- **User Profiles & Wallets**: Deep wallet integration (Internet Identity, Plug, Stoic), with customizable user profiles and activity feeds.
- **AI Metadata Automation**: Scripts for automatic trait extraction, metadata generation, and image processing, streamlining large-scale NFT drops.

---

## 1. Collection Browsing & Analytics

### Filters & Sorting

- **Price**: Sort NFTs by current listing price (ascending/descending). Requires up-to-date price index from marketplace canister.
- **Rarity**: Filter/sort by rarity score, calculated from trait frequencies (precomputed or on-chain).
- **Recently Listed / Oldest**: Sort by listing timestamp.
- **Top Offer**: Show highest active bid per NFT.
- **Search**: Case-insensitive, partial match on NFT name, traits, or ID.

### Views

- **Grid, Compact Grid, Mosaic, Table**: Multiple layouts for the same dataset, user-switchable.
- **Collection Banner & Metadata**: Display collection image/video, title, description, creator, tags, and social links (all from collection metadata, stored on IC or IPFS).

### Analytics

- **Floor Price**: Minimum active listing price.
- **Top Offer**: Highest bid across all NFTs in the collection.
- **Total Volume**: Sum of all past sales (ICP).
- **% Listed**: Ratio of listed NFTs to total supply.
- **Unique Holders, Supply, Listings Over Time**: Aggregated from canister and indexer data.

---

## 2. NFT Detail Page

### Media & Metadata

- **Image/Video Viewer**: High-res display, zoom, fullscreen, fallback handling.
- **Metadata**: Title, description (sanitized), tags, traits with rarity indicators (requires global trait index).

### Ownership & Profile

- **Owner Info**: Principal ID, profile lookup (avatar, username, links), "you own this" indicator.
- **Creator Info**: Display creator's profile and collection.

### Traits & Rarity

- **Trait Grid**: List all trait categories/values, with rarity % (how many NFTs share this trait).

### Transaction History

- **Event Log**: Sales, listings, bids/offers, with timestamps, amounts, and counterparties. Pulled from marketplace canister's event log.

### Blockchain Details

- **Token ID, Canister ID, Standard, Tx Hashes**: All relevant on-chain identifiers and status.

---

## 3. Marketplace Explorer

### Categories & Discovery

- **Categories**: Art, PFPs, Gaming, Photography, etc. (collections tagged, with category index).
- **Trending/Top**: Based on recent volume, sales, or floor price (computed off-chain or via scheduled IC task).
- **Featured Carousel**: Horizontal slider of highlighted collections (manual or algorithmic selection), showing banner, floor price, % listed, and volume.

---

## 4. User Account & Wallet Integration

### Wallet Connect

- **Supported**: Internet Identity, Plug, Stoic, (optionally Google OAuth bridged to a principal).
- **Profile**: Display name, avatar (NFT or uploaded), bio, social links.
- **Owned NFTs**: Queried via principal from ledger canister.
- **Listings & Offers**: Track user's marketplace activity.
- **Activity Feed**: Chronological log of user actions.

### Ownership Display

- **Contextual UI**: Show "you own this", "list now", or "make offer" based on wallet state and NFT ownership.

---

## 5. Creator Tools & Collection Management

### Collection Creation

- **Deploy New Collection**: CLI and canister workflow for launching a new NFT collection (see `example/README.md`).
- **Configure Metadata**: Set collection name, symbol, description, logo, authorized principals, and more.

### Asset & Metadata Upload

- **CLI Tool**: Upload images/assets to the collection's storage canister.
- **Metadata Generation**:
  - **Interactive**: Step-by-step CLI prompts for ICRC97-compliant metadata.
  - **Batch/CLI**: Command-line options for bulk metadata creation.
  - **Validation**: CLI tool to check metadata files for standard compliance.

### Minting

- **Mint with Metadata URL**: Mint NFTs referencing uploaded metadata.
- **Mint with Metadata Inline**: Create and mint in one step (interactive or CLI).
- **Batch Minting**: Supported via CLI and scripts.

---

## 6. AI-Powered Metadata & Image Tools

### Automated Metadata Generation

- **Scripts**: `scripts/metadata_ollama.py` and `scripts/metadata_blip-ollama.py`
  - **Image Processing**: Convert PNGs to optimized WebP, resize, and embed XMP metadata.
  - **AI Trait Extraction**: Use multimodal models (Qwen 2.5 VL via Ollama, or BLIP for fast mode) to analyze images and generate:
    - NFT name
    - Creative description
    - 3–5 unique traits (from visual features)
  - **Batch Workflow**: Process entire asset folders, auto-generate metadata JSONs, and embed into images.
  - **Digital Signature**: Optionally embed SHA-256 hash and creation timestamp in XMP metadata for provenance.

### Integration

- **Output**: Metadata files ready for upload/minting via CLI tools.
- **Customization**: Configurable for project/collection name, creator, license, and more.

---

## 7. Data Flows & Security

- **On-chain Data**: Ownership, listings, offers, and transaction history from canisters.
- **Off-chain/Indexed Data**: Metadata, analytics, and search indexes for fast filtering and sorting.
- **Security**: Input sanitization, canister ID whitelisting, wallet delegation, and rate-limiting for abuse prevention.

---

## 8. Summary Table

| Feature                | Technical Needs                                                      |
|------------------------|-----------------------------------------------------------------------|
| Collection Filters     | Index NFTs with metadata, price, rarity, and sort logic              |
| Collection Analytics   | Aggregate floor, volume, % listed from marketplace data              |
| NFT Viewer             | Load media, show metadata, owner, traits, and history                |
| Marketplace Explorer   | Surfaced by categories, with trending/top logic                      |
| Featured Carousel      | Predefined or auto-picked collections, show metrics                  |
| Profile + Wallet       | Bind Internet Identity/Wallet to optional user profile               |
| Search & Sort          | On-collection query capabilities and pagination support              |
| Creator Tools          | CLI + AI scripts for upload, metadata, validation, and batch minting |

---

## References

- [Core NFT Canister Technical Overview](src/core_nft/README.md)
- [Deployment & Creator Workflow](example/README.md)
- [AI Metadata Scripts](scripts/metadata_ollama.py), [BLIP Fast Mode](scripts/metadata_blip-ollama.py)

---

*This document provides a technical blueprint for a robust, user-friendly, and creator-empowering NFT marketplace on the Internet Computer, leveraging both on-chain and off-chain data, and advanced automation for large-scale NFT drops.* 