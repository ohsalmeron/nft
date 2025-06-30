<template>
  <div class="app-container">
    <!-- Collection Banner -->
    <CollectionBanner />
    
    <!-- Main Content -->
    <main class="main-content">
      <!-- Loading State -->
      <div v-if="store.loading && store.nfts.length === 0" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="text-secondary">Loading NFT collection...</p>
      </div>
      
      <!-- NFT Grid -->
      <div v-else>
        <div class="nft-grid">
          <NftCard 
            v-for="nft in store.nfts" 
            :key="nft.id" 
            :nft="nft" 
            @click="openNftModal(nft)"
          />
        </div>
        
        <!-- Infinite Scroll Sentinel -->
        <div ref="observerRef" class="scroll-sentinel"></div>
        
        <!-- Loading More -->
        <div v-if="store.loadingMore" class="loading-more">
          <div class="loading-spinner"></div>
        </div>
        
        <!-- No More NFTs -->
        <div v-if="!store.hasMore && store.nfts.length > 0" class="no-more-nfts">
          No more NFTs to load.
        </div>
      </div>
    </main>
    
    <!-- NFT Modal -->
    <NftModal 
      :nft="store.selectedNft" 
      :show="store.showModal" 
      :collection="store.collectionData"
      @close="closeNftModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useNftStore } from './stores/nftStore'
import CollectionBanner from './components/CollectionBanner.vue'
import NftCard from './components/NftCard.vue'
import NftModal from './components/NftModal.vue'

const store = useNftStore()
const observerRef = ref<HTMLElement>()

// Only destructure actions, not reactive state
const {
  fetchCollectionMetadata,
  fetchNFTs,
  loadMore,
  openNftModal,
  closeNftModal
} = store

// Infinite scroll observer
let observer: IntersectionObserver | null = null

onMounted(() => {
  // Initial data fetch
  fetchCollectionMetadata()
  fetchNFTs(true)
  
  // Set up infinite scroll
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && store.hasMore && !store.loading && !store.loadingMore) {
        loadMore()
      }
    },
    { threshold: 1 }
  )
  
  if (observerRef.value) {
    observer.observe(observerRef.value)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

// Watch for changes in the sentinel element
watch(observerRef, (newRef) => {
  if (observer && newRef) {
    observer.observe(newRef)
  }
})
</script>

<style scoped>
/* Component-specific styles can go here */
</style>
