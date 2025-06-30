<template>
  <div v-if="show && nft" class="nft-modal-backdrop" @click="$emit('close')">
    <div class="nft-modal-grid" @click.stop>
      <!-- Left: Image -->
      <div class="modal-image-container">
      <button
        @click="$emit('close')"
        class="modal-close-button"
        aria-label="Close Modal"
      >
        &times;
      </button>
        <img
          v-if="nft.image && imageSrc"
          :src="imageSrc"
          :alt="nft.name"
          class="modal-image"
          :class="{ 'image-loaded': imageLoaded, 'image-loading': imageLoading }"
        />
        <div
          v-if="imageLoading && nft.image"
          class="modal-image-loading"
        >
          <div class="loading-spinner"></div>
        </div>
        <div
          v-if="!nft.image || !imageSrc"
          class="modal-no-image"
        >
          No Image Available
        </div>
        <div class="modal-badge">#{{ nft.id }}</div>
      </div>
      <!-- Right: Info -->
      <div class="modal-info-scrollable">
        <div class="modal-main-info">
          <div class="modal-nft-id">NFT #{{ nft.id }}</div>
          <div class="modal-collection-row">
            <span v-if="collection">{{ collection.name }}</span>
            <span v-if="ownerPrincipal"> - Owned by {{ shortPrincipal(ownerPrincipal) }}</span>
          </div>
          <div class="modal-standard-pills">
            <span v-if="collection" class="pill">{{ collection.standard }}</span>
            <span v-if="collection" class="pill">ICP</span>
          </div>
        </div>
        <h2 class="modal-title">{{ nft.name }}</h2>
        <!-- Accordion: Traits -->
        <div class="modal-accordion">
          <div class="accordion-header" @click="showTraits = !showTraits">
            <span>Traits</span>
            <span>{{ showTraits ? '▲' : '▼' }}</span>
          </div>
          <div v-show="showTraits" class="accordion-content">
        <div v-if="nft.attributes && nft.attributes.length > 0" class="traits-section">
          <div class="traits-grid">
            <div
              v-for="(attr, idx) in nft.attributes"
              :key="idx"
              class="nft-trait"
            >
              <div class="trait-type">
                {{ attr.trait_type }}
              </div>
              <div class="trait-value">{{ attr.value }}</div>
            </div>
          </div>
            </div>
            <div v-else class="traits-section">No traits available.</div>
          </div>
        </div>
        <!-- Accordion: About -->
        <div class="modal-accordion">
          <div class="accordion-header" @click="showAbout = !showAbout">
            <span>About</span>
            <span>{{ showAbout ? '▲' : '▼' }}</span>
          </div>
          <div v-show="showAbout" class="accordion-content">
            <p class="modal-description">
              {{ nft.description || 'No description provided.' }}
            </p>
          </div>
        </div>
        <!-- Accordion: Blockchain Details -->
        <div class="modal-accordion">
          <div class="accordion-header" @click="showBlockchain = !showBlockchain">
            <span>Blockchain Details</span>
            <span>{{ showBlockchain ? '▲' : '▼' }}</span>
          </div>
          <div v-show="showBlockchain" class="accordion-content">
            <ul class="blockchain-details-list">
              <li v-for="(item, idx) in blockchainDetails" :key="idx">
                <span class="blockchain-label">{{ item.label }}:</span>
                <span class="blockchain-value">{{ item.value }}</span>
              </li>
            </ul>
          </div>
        </div>
        <!-- Accordion: Transaction History -->
        <div class="modal-accordion">
          <div class="accordion-header" @click="showTxHistory = !showTxHistory">
            <span>Transaction History</span>
            <span>{{ showTxHistory ? '▲' : '▼' }}</span>
          </div>
          <div v-show="showTxHistory" class="accordion-content">
            <div v-if="txLoading" class="tx-loading"><div class="loading-spinner"></div> Loading...</div>
            <div v-else-if="txHistory.length === 0" class="tx-empty">No history found.</div>
            <ul v-else class="tx-list">
              <li v-for="tx in txHistory" :key="tx.id" class="tx-item">
                <span class="tx-type" :class="'tx-' + tx.type.toLowerCase()">{{ tx.type }}</span>
                <span class="tx-from">{{ tx.from ? 'From: ' + tx.from : '' }}</span>
                <span class="tx-to">{{ tx.to ? 'To: ' + tx.to : '' }}</span>
                <span class="tx-date">{{ tx.timestamp ? new Date(Number(tx.timestamp) / 1_000_000).toLocaleString() : '' }}</span>
                <span class="tx-memo" v-if="tx.memo">Memo: {{ tx.memo }}</span>
              </li>
            </ul>
          </div>
        </div>
        <!-- Accordion: Approvals -->
        <div class="modal-accordion">
          <div class="accordion-header" @click="showApprovals = !showApprovals">
            <span>Approvals</span>
            <span>{{ showApprovals ? '▲' : '▼' }}</span>
          </div>
          <div v-show="showApprovals" class="accordion-content">
            <div v-if="approvalsLoading" class="tx-loading"><div class="loading-spinner"></div> Loading...</div>
            <div v-else-if="approvals.length === 0" class="tx-empty">No approvals.</div>
            <ul v-else class="tx-list">
              <li v-for="(appr, idx) in approvals" :key="idx" class="tx-item">
                <span class="tx-type tx-approve">Spender: {{ appr.approval_info?.spender?.owner }}</span>
                <span class="tx-date">{{ appr.approval_info?.expires_at ? 'Expires: ' + new Date(Number(appr.approval_info.expires_at) / 1_000_000).toLocaleString() : '' }}</span>
                <span class="tx-memo" v-if="appr.approval_info?.memo">Memo: {{ appr.approval_info.memo }}</span>
              </li>
            </ul>
          </div>
        </div>
        <!-- Accordion: More from this Collection -->
        <div class="modal-accordion">
          <div class="accordion-header" @click="showMore = !showMore">
            <span>More from this Collection</span>
            <span>{{ showMore ? '▲' : '▼' }}</span>
          </div>
          <div v-show="showMore" class="accordion-content">
            <div class="more-nfts-grid">
              <NftCard
                v-for="n in moreNfts"
                :key="n.id"
                :nft="n"
                @click="$emit('close'); store.openNftModal(n)"
              />
            </div>
            <div v-if="moreNfts.length === 0">No other NFTs found.</div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useNftStore } from '../stores/nftStore'
import NftCard from './NftCard.vue'

interface NftAttribute {
  trait_type: string
  value: string | number
}

interface Nft {
  id: string
  name: string
  description: string
  image: string
  attributes: NftAttribute[]
  metadataUrl: string | null
}

interface CollectionInfo {
  name: string
  standard: string
  canisterId: string
}

interface Props {
  nft: Nft | null
  show: boolean
  collection?: CollectionInfo | null
}

const props = defineProps<Props>()
defineEmits<{
  close: []
}>()

const store = useNftStore()

// Individual image loading state for this modal
const imageLoaded = ref(false)
const imageLoading = ref(false)
const imageSrc = ref('')

// Load image when component mounts or image URL changes
const loadImage = async () => {
  if (!props.nft?.image) {
    imageLoaded.value = true
    imageLoading.value = false
    return
  }

  // Check if already cached
  if (store.isImageLoaded(props.nft.image)) {
    imageSrc.value = props.nft.image
    imageLoaded.value = true
    imageLoading.value = false
    return
  }

  // Start loading
  imageLoading.value = true
  imageLoaded.value = false
  imageSrc.value = props.nft.image

  try {
    const img = new Image()
    img.onload = () => {
      imageLoaded.value = true
      imageLoading.value = false
    }
    img.onerror = () => {
      imageLoaded.value = true
      imageLoading.value = false
      imageSrc.value = '' // Clear src to show "No Image"
    }
    img.src = props.nft.image
  } catch (error) {
    imageLoaded.value = true
    imageLoading.value = false
    imageSrc.value = ''
  }
}

// Watch for image URL changes
watch(() => props.nft?.image, () => {
  loadImage()
}, { immediate: true })

onMounted(() => {
  loadImage()
})

const ownerPrincipal = ref<string | null>(null)

// Utility to shorten principal
const shortPrincipal = (pid: string) => pid.slice(0, 5) + '...' + pid.slice(-3)

// Fetch owner principal for the NFT
const fetchOwner = async () => {
  if (!props.nft) {
    ownerPrincipal.value = null
    return
  }
  try {
    // Assume store has a method to fetch owner, or implement here
    // Replace with actual canister call if needed
    ownerPrincipal.value = await store.fetchNftOwner(props.nft.id)
  } catch (e) {
    ownerPrincipal.value = null
  }
}

watch(() => props.nft?.id, () => {
  fetchOwner()
}, { immediate: true })

onMounted(() => {
  fetchOwner()
})

// Accordion state
const showTraits = ref(true)
const showAbout = ref(false)
const showBlockchain = ref(false)
const showMore = ref(false)
const showTxHistory = ref(false)
const showApprovals = ref(false)

// Transaction history and approvals state
const txHistory = ref<any[]>([])
const txLoading = ref(false)
const approvals = ref<any[]>([])
const approvalsLoading = ref(false)

// Fetch transaction history and approvals when modal opens or NFT changes
const fetchTxAndApprovals = async () => {
  if (!props.nft) return
  txLoading.value = true
  approvalsLoading.value = true
  txHistory.value = []
  approvals.value = []
  try {
    txHistory.value = await store.fetchNftTransactionHistory(props.nft.id)
  } finally {
    txLoading.value = false
  }
  try {
    approvals.value = await store.fetchNftApprovals(props.nft.id)
  } finally {
    approvalsLoading.value = false
  }
}

watch(() => props.nft?.id, () => {
  loadImage()
  fetchTxAndApprovals()
}, { immediate: true })

onMounted(() => {
  loadImage()
  fetchTxAndApprovals()
})

const MAINNET_CANISTER_ID = "xea2t-daaaa-aaaaj-qnp2a-cai"

// Blockchain details computed
const blockchainDetails = computed(() => {
  return [
    { label: 'Canister ID', value: props.collection?.canisterId || MAINNET_CANISTER_ID },
    { label: 'Token ID', value: props.nft?.id || '-' },
    { label: 'Standard', value: props.collection?.standard || 'ICRC7' },
    { label: 'Chain', value: 'ICP' },
  ]
})

// More from this collection (3 random NFTs, excluding current)
const moreNfts = computed(() => {
  if (!props.nft) return []
  const filtered = store.nfts.filter(n => n.id !== props.nft?.id)
  if (filtered.length <= 3) return filtered
  // Pick 3 random
  const shuffled = filtered.slice().sort(() => 0.5 - Math.random())
  return shuffled.slice(0, 3)
})
</script>

<style scoped>
.nft-modal-backdrop {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(20, 20, 40, 0.85);
  backdrop-filter: blur(32px) saturate(1.2);
  -webkit-backdrop-filter: blur(32px) saturate(1.2);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow-y: auto;
  animation: modalFadeIn 0.4s cubic-bezier(0.4,0,0.2,1);
}

@keyframes modalFadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}

.nft-modal-grid {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  min-width: 0;
  min-height: 0;
  background: rgba(255, 255, 255, 0.10);
  border-radius: 0;
  overflow: hidden;
  position: relative;
  box-shadow: none;
  border: none;
  animation: modalContentFadeIn 0.6s cubic-bezier(0.4,0,0.2,1);
}

@media (min-width: 900px) {
  .nft-modal-grid {
    flex-direction: row;
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    min-width: 0;
    min-height: 0;
  }
  .modal-image-container {
    width: 50%;
    min-width: 0;
    max-width: none;
    height: 100vh;
    border-radius: 0;
    box-shadow: 8px 0 32px 0 rgba(139, 92, 246, 0.10);
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
  }
  .modal-info-scrollable {
    width: 50%;
    min-width: 0;
    max-width: none;
    height: 100vh;
    max-height: none;
    border-radius: 0;
    background: rgba(255, 255, 255, 0.18);
    position: relative;
    box-shadow: -8px 0 32px 0 rgba(139, 92, 246, 0.10);
    overflow-y: auto;
    padding: 48px 40px 48px 40px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    scrollbar-width: thin;
    scrollbar-color: #a78bfa #232136;
  }
  .modal-info-scrollable::-webkit-scrollbar {
    width: 8px;
    background: #232136;
  }
  .modal-info-scrollable::-webkit-scrollbar-thumb {
    background: #a78bfa;
    border-radius: 8px;
  }
}

@media (max-width: 899px) {
  .nft-modal-grid {
    flex-direction: column;
    width: 100vw;
    height: auto;
    max-width: 100vw;
    max-height: none;
    min-width: 0;
    min-height: 0;
  }
  .modal-image-container {
    width: 100vw;
    height: 100vw;
    max-width: 100vw;
    min-height: 0;
    border-radius: 0;
    position: sticky;
    top: 0;
    z-index: 1;
    background: linear-gradient(135deg, #2e1065 0%, #a78bfa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
    padding: 8px;
    box-sizing: border-box;
  }
  .modal-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 12px;
    box-shadow: 0 4px 24px 0 rgba(139, 92, 246, 0.10);
    background: rgba(255,255,255,0.04);
  }
  .modal-info-scrollable {
    width: 100vw;
    max-width: 100vw;
    max-height: none;
    height: auto;
    overflow-y: visible;
    border-radius: 0;
    background: rgba(255, 255, 255, 0.18);
    position: relative;
    padding: 32px 16px 32px 16px;
    box-shadow: 0 -8px 32px 0 rgba(139, 92, 246, 0.08);
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
  .modal-close-button {
    top: 16px;
    right: 16px;
    width: 40px;
    height: 40px;
    font-size: 2rem;
    z-index: 2;
  }
}

.modal-image-container {
  aspect-ratio: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #2e1065 0%, #a78bfa 100%);
  border-radius: 0;
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px 0 rgba(139, 92, 246, 0.10);
}

.modal-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 0;
  box-shadow: 0 4px 24px 0 rgba(139, 92, 246, 0.10);
  transition: all 0.5s cubic-bezier(0.4,0,0.2,1);
  background: rgba(255,255,255,0.04);
}

.modal-image.image-loading {
  opacity: 0;
  transform: scale(0.97);
}

.modal-image.image-loaded {
  opacity: 1;
  transform: scale(1);
}

.modal-image-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.modal-image-loading .loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #a78bfa;
  border-top: 4px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal-no-image {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-base);
  color: var(--text-muted);
  background: linear-gradient(135deg, #1f2937, #374151);
  font-weight: 500;
  letter-spacing: 0.05em;
}

.modal-info-scrollable {
  padding: var(--spacing-2xl);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  text-align: center;
  min-height: 0;
  position: relative;
  background: rgba(255,255,255,0.18);
  box-shadow: -4px 0 24px 0 rgba(139, 92, 246, 0.08);
  border-left: 1.5px solid rgba(139, 92, 246, 0.10);
}

.modal-close-button {
  position: absolute;
  top: 32px;
  right: 32px;
  width: 48px;
  height: 48px;
  font-size: 2.4rem;
  z-index: 1002;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(16px) saturate(1.2);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  border-radius: 50%;
  color: #a78bfa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
  border: 2px solid rgba(139, 92, 246, 0.18);
  box-shadow: 0 2px 8px 0 rgba(139, 92, 246, 0.10);
}
@media (max-width: 899px) {
  .modal-close-button {
    top: 16px;
    right: 16px;
    width: 40px;
    height: 40px;
    font-size: 2rem;
  }
}

.modal-badge {
  position: absolute;
  left: var(--spacing-lg);
  bottom: var(--spacing-lg);
  background: rgba(139, 92, 246, 0.22);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1.5px solid #a78bfa;
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.05em;
  z-index: 2;
  box-shadow: 0 2px 8px 0 rgba(139, 92, 246, 0.10);
  text-shadow: 0 1px 4px #a78bfa44;
}

.modal-main-info {
  margin-bottom: var(--spacing-lg);
}

.modal-nft-id {
  font-size: 1.1rem;
  font-weight: 700;
  color: #a78bfa;
  margin-bottom: var(--spacing-xs);
  letter-spacing: 0.04em;
}

.modal-collection-row {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
}

.modal-standard-pills {
  display: flex;
  gap: var(--spacing-xs);
  justify-content: center;
  margin-bottom: var(--spacing-md);
}

.pill {
  background: linear-gradient(90deg, #a78bfa 0%, #818cf8 100%);
  color: #fff;
  border-radius: var(--radius-md);
  padding: 3px 14px;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  border: 1.5px solid #a78bfa;
  box-shadow: 0 1px 4px 0 #a78bfa22;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.pill:hover, .pill:focus {
  background: linear-gradient(90deg, #818cf8 0%, #a78bfa 100%);
  color: #fff;
  box-shadow: 0 2px 8px 0 #a78bfa33;
}

.modal-title {
  font-size: 2.1rem;
  font-weight: 800;
  margin-bottom: var(--spacing-lg);
  color: #fff;
  letter-spacing: -0.025em;
  line-height: 1.2;
  text-shadow: 0 2px 8px #a78bfa22;
}

.modal-accordion {
  margin-bottom: var(--spacing-lg);
  background: rgba(255, 255, 255, 0.10);
  border-radius: var(--radius-md);
  box-shadow: 0 1px 4px rgba(139, 92, 246, 0.06);
  overflow: visible;
  transition: box-shadow 0.2s;
}
.modal-accordion:hover {
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.12);
}

.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  font-weight: 700;
  font-size: 1.1rem;
  color: #a78bfa;
  cursor: pointer;
  background: rgba(139, 92, 246, 0.10);
  border-bottom: 1px solid rgba(139, 92, 246, 0.13);
  user-select: none;
  transition: background 0.2s;
}
.accordion-header:hover, .accordion-header:focus {
  background: rgba(139, 92, 246, 0.18);
}
.accordion-header span:last-child {
  font-size: 1.2em;
  transition: transform 0.2s;
}

.accordion-content {
  padding: var(--spacing-md);
  background: rgba(255,255,255,0.06);
  animation: accordionFadeIn 0.3s cubic-bezier(0.4,0,0.2,1);
  max-height: none;
  overflow: visible;
}
@keyframes accordionFadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.traits-section {
  margin-bottom: var(--spacing-md);
  max-height: none;
  overflow: visible;
}
.traits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-md);
  justify-content: center;
  max-width: 100%;
}
.nft-trait {
  background: rgba(255, 255, 255, 0.13);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 1rem;
  text-align: center;
  min-width: 80px;
  transition: all 0.3s;
  border: 1.5px solid rgba(139, 92, 246, 0.13);
  font-weight: 600;
  color: #fff;
  box-shadow: 0 1px 4px 0 #a78bfa11;
}
.nft-trait:hover {
  background: rgba(139, 92, 246, 0.18);
  color: #fff;
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 2px 8px 0 #a78bfa22;
}
.trait-type {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: #a78bfa;
  margin-bottom: var(--spacing-xs);
  opacity: 0.85;
}
.trait-value {
  font-weight: 700;
  color: #fff;
  font-size: 1.05rem;
}

.blockchain-details-list {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}
.blockchain-label {
  font-weight: 700;
  color: #a78bfa;
}
.blockchain-value {
  margin-left: 8px;
  color: #fff;
  font-weight: 600;
}

.more-nfts-grid {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
  margin-top: var(--spacing-sm);
}
.more-nfts-grid :deep(.nft-card) {
  box-shadow: 0 2px 8px 0 #a78bfa22;
  border: 1.5px solid #a78bfa33;
  transition: box-shadow 0.2s, border 0.2s;
}
.more-nfts-grid :deep(.nft-card):hover {
  box-shadow: 0 8px 24px 0 #a78bfa44;
  border: 1.5px solid #a78bfa;
}

.tx-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-md);
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
}

.tx-empty {
  padding: var(--spacing-md);
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 500;
}

.tx-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tx-item {
  padding: var(--spacing-md);
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
}

.tx-type {
  font-weight: 700;
  color: #a78bfa;
  margin-right: var(--spacing-md);
}

.tx-from, .tx-to {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.tx-date {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.tx-memo {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.tx-approve {
  color: #818cf8;
}
</style> 