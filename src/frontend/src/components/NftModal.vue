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
          v-if="nft.image"
          :src="imageSrc"
          :alt="nft.name"
          class="modal-image"
          :class="{ 'image-loaded': imageLoaded, 'image-loading': !imageLoaded }"
        />
        <div
          v-if="!imageLoaded && nft.image"
          class="modal-image-loading"
        >
          <div class="loading-spinner"></div>
        </div>
        <div
          v-if="!nft.image"
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
  nft: Nft | null
  show: boolean
}

const props = defineProps<Props>()
defineEmits<{
  close: []
}>()

const imageLoaded = ref(false)
const imageSrc = ref('')

// Image loading logic
watch(() => props.nft?.image, async (newImage) => {
  if (!newImage) {
    imageLoaded.value = true
    imageSrc.value = ''
    return
  }
  
  imageLoaded.value = false
  imageSrc.value = ''
  
  try {
    // Try to get from cache first
    const cachedResponse = await imageCache.getCachedImage(newImage)
    if (cachedResponse) {
      const blob = await cachedResponse.blob()
      imageSrc.value = URL.createObjectURL(blob)
      imageLoaded.value = true
    } else {
      // Load from network
      imageSrc.value = newImage
      const img = new window.Image()
      img.onload = () => {
        imageLoaded.value = true
        imageCache.cacheImage(newImage)
      }
      img.onerror = () => {
        imageLoaded.value = true
      }
      img.src = newImage
    }
  } catch (error) {
    imageSrc.value = newImage
    imageLoaded.value = true
  }
}, { immediate: true })

// Simple image cache utility
const imageCache = {
  async getCachedImage(url: string) {
    try {
      const cache = await caches.open('nft-images')
      return await cache.match(url)
    } catch {
      return null
    }
  },
  
  async cacheImage(url: string) {
    try {
      const cache = await caches.open('nft-images')
      await cache.add(url)
    } catch {
      // Ignore cache errors
    }
  }
}
</script>

<style scoped>
/* Component-specific styles are handled by global CSS */
</style> 