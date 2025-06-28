<template>
  <div v-if="show && nft" class="nft-modal-backdrop" @click="$emit('close')">
    <div class="nft-modal" @click.stop>
      <!-- Close Button -->
      <button
        @click="$emit('close')"
        class="modal-close-button"
        aria-label="Close Modal"
      >
        &times;
      </button>

      <!-- NFT Image - Large, Edge-to-Edge, Square -->
      <div class="modal-image-container">
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
      </div>

      <!-- NFT Information - Gallery Style -->
      <div class="modal-info">
        <h2 class="modal-title">{{ nft.name }}</h2>
        <p class="modal-description">
          {{ nft.description || "No description provided." }}
        </p>

        <!-- Traits - Professional Display -->
        <div v-if="nft.attributes && nft.attributes.length > 0" class="traits-section">
          <h3 class="traits-title">
            Traits
          </h3>
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
      </div>

      <!-- NFT ID Badge - Gallery Style -->
      <div class="modal-badge">
        #{{ nft.id }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useNftStore } from '../stores/nftStore'

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

interface Props {
  nft: Nft | null
  show: boolean
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
</script>

<style scoped>
/* NFT Modal Component */
.nft-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  overflow-y: auto;
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.nft-modal {
  position: relative;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: var(--radius-2xl);
  overflow: hidden;
  z-index: 1001;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: modalSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) ease-out;
  box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.25), 0 0 20px rgba(139, 92, 246, 0.3);
  border: 1px solid rgba(139, 92, 246, 0.3);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-close-button {
  position: absolute;
  top: var(--spacing-lg);
  right: var(--spacing-lg);
  width: 40px;
  height: 40px;
  font-size: var(--font-size-xl);
  z-index: 10;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 50%;
  color: var(--text-white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.modal-close-button:hover {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
  transform: scale(1.1);
}

.modal-close-button:active {
  transform: scale(0.95);
}

.modal-image-container {
  width: 100%;
  aspect-ratio: 1;
  min-height: 0;
  max-height: 60vh;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  position: relative;
  flex-shrink: 0;
}

.modal-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: all 0.5s ease;
}

.modal-image.image-loading {
  opacity: 0;
  transform: scale(0.95);
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
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.modal-image-loading .loading-spinner {
  width: 48px;
  height: 48px;
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

.modal-info {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  text-align: center;
  width: 100%;
  padding: var(--spacing-2xl);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin-bottom: var(--spacing-lg);
  color: var(--text-primary);
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.modal-description {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: var(--spacing-2xl);
  min-height: 40px;
  line-height: 1.6;
  letter-spacing: 0.025em;
}

.traits-section {
  margin-bottom: var(--spacing-2xl);
}

.traits-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-accent);
  position: relative;
}

.traits-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 2px;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  border-radius: 9999px;
}

.traits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-md);
  justify-content: center;
  max-width: 100%;
}

.nft-trait {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  text-align: center;
  min-width: 80px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.nft-trait:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.trait-type {
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-accent);
  margin-bottom: var(--spacing-xs);
  opacity: 0.8;
}

.trait-value {
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.modal-badge {
  position: absolute;
  left: var(--spacing-lg);
  bottom: var(--spacing-lg);
  background: rgba(139, 92, 246, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-accent);
  letter-spacing: 0.05em;
  z-index: 2;
}
</style> 