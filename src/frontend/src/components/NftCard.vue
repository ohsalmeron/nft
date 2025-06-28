<template>
  <div class="nft-card" @click="$emit('click')">
    <div class="nft-card-image-container">
      <img
        v-if="nft.image && imageSrc"
        :src="imageSrc"
        :alt="nft.name"
        class="nft-card-image"
        :class="{ 'image-loaded': imageLoaded, 'image-loading': !imageLoaded }"
        @load="onImageLoad"
        @error="onImageError"
      />
      <div
        v-if="!imageLoaded && nft.image && imageSrc"
        class="nft-card-loading"
      >
        <div class="loading-spinner"></div>
      </div>
      <div
        v-if="!nft.image || !imageSrc"
        class="nft-card-no-image"
      >
        No Image
      </div>
      <div class="glass-badge nft-card-badge">
        #{{ nft.id }}
      </div>
    </div>
    <div class="nft-card-content">
      <h3 class="nft-card-title">
        {{ nft.name }}
      </h3>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

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
  nft: Nft
}

const props = defineProps<Props>()
defineEmits<{
  click: []
}>()

const imageLoaded = ref(false)
const imageSrc = ref('')

// Simplified image loading logic
watch(() => props.nft?.image, (newImage) => {
  if (!newImage) {
    imageLoaded.value = false
    imageSrc.value = ''
    return
  }
  
  // Reset state
  imageLoaded.value = false
  imageSrc.value = newImage
}, { immediate: true })

// Image event handlers
const onImageLoad = () => {
  imageLoaded.value = true
}

const onImageError = () => {
  imageLoaded.value = true
  imageSrc.value = '' // Clear the src to show "No Image"
}
</script>

<style scoped>
/* NFT Card Component */
.nft-card {
  position: relative;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  transform: translateY(0);
  animation: cardEntrance 0.6s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.nft-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.25), 0 0 20px rgba(139, 92, 246, 0.3);
  border-color: rgba(139, 92, 246, 0.3);
}

.nft-card:hover::before {
  opacity: 1;
}

.nft-card:hover .nft-card-image {
  transform: scale(1.08);
}

.nft-card:hover .nft-card-badge {
  transform: scale(1.1);
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
}

.nft-card:hover .nft-card-content {
  background: rgba(139, 92, 246, 0.15);
}

.nft-card.loading {
  pointer-events: none;
  opacity: 0.7;
}

@keyframes cardEntrance {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.nft-card-image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  background: rgba(255, 255, 255, 0.05);
}

.nft-card-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform 0.5s ease;
  will-change: transform;
}

.nft-card-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.nft-card-loading .loading-spinner {
  width: 32px;
  height: 32px;
  border-width: 2px;
}

.nft-card-no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  background: linear-gradient(135deg, #1f2937, #374151);
  font-size: var(--font-size-sm);
  font-weight: 500;
  letter-spacing: 0.05em;
}

.nft-card-badge {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-white);
  letter-spacing: 0.05em;
  transition: all 0.3s ease;
  z-index: 2;
}

.nft-card-content {
  padding: var(--spacing-lg);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.3s ease;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.nft-card-title {
  font-size: clamp(0.875rem, 1.2vw, 1rem);
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
  letter-spacing: -0.025em;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.nft-card:hover .nft-card-title {
  color: var(--text-white);
}
</style> 