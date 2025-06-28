<template>
  <div class="nft-card" @click="$emit('click')">
    <div class="nft-card-image-container">
      <img
        v-if="nft.image"
        :src="imageSrc"
        :alt="nft.name"
        class="nft-card-image"
        :class="{ 'image-loaded': imageLoaded, 'image-loading': !imageLoaded }"
      />
      <div
        v-if="!imageLoaded && nft.image"
        class="nft-card-loading"
      >
        <div class="loading-spinner"></div>
      </div>
      <div
        v-if="!nft.image"
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

// Simple image cache utility (you can enhance this)
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