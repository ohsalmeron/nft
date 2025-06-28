<template>
  <header class="collection-banner">
    <!-- Refresh Button -->
    <button
      @click="refresh"
      :disabled="refreshing"
      class="refresh-button"
      title="Refresh"
    >
      <ArrowPathIcon :class="{ 'spinning': refreshing }" class="refresh-icon" />
    </button>

    <!-- Bottom Left: Logo, Name, Symbol, Description, Custom Metadata -->
    <div class="banner-left">
      <!-- Large Logo -->
      <div class="logo-container">
        <img
          v-if="collectionLogo && logoLoaded"
          :src="logoSrc"
          alt="Collection Logo"
          class="collection-logo"
        />
        <div
          v-else-if="collectionLogo && !logoLoaded"
          class="logo-loading"
        >
          <div class="loading-spinner"></div>
        </div>
        <span
          v-else
          class="logo-placeholder"
        >
          <span class="placeholder-text">?</span>
        </span>
      </div>

      <!-- Name, Symbol, Description, Custom Metadata -->
      <div v-if="!collectionLoading" class="collection-info">
        <div class="collection-header">
          <span class="collection-name">
            {{ collectionName || nullText('Name') }}
          </span>
          <span class="collection-symbol">
            {{ collectionSymbol || nullText('Symbol') }}
          </span>
        </div>
        <div class="collection-description">
          {{ renderDescription() }}
        </div>
        <div class="social-links">
          <template v-for="(item, idx) in customMetadata" :key="idx">
            <a
              v-if="item[1]?.Text && isSocialLink(item[0])"
              :href="item[1].Text"
              target="_blank"
              rel="noopener noreferrer"
              class="social-link"
            >
              <component :is="getSocialIcon(item[0])" class="social-icon" />
              {{ item[0] }}
            </a>
          </template>
          <div v-if="!hasSocialLinks" class="no-social-links">
            {{ nullText('Custom Metadata') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Right: Stats and Standards -->
    <div class="banner-right">
      <div v-if="!collectionLoading" class="collection-stats">
        <div class="stat-item">
          <span class="stat-value">
            {{ totalCount !== undefined && totalCount !== null ? totalCount : nullText('Total Supply') }}
          </span>
          <span class="stat-label">Total Supply</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">
            {{ collectionSupplyCap !== undefined && collectionSupplyCap !== null ? collectionSupplyCap : '∞' }}
          </span>
          <span class="stat-label">Supply Cap</span>
        </div>
      </div>
      <div v-if="!collectionLoading" class="standards-container">
        <span
          v-for="(std, idx) in supportedStandards"
          :key="idx"
          class="standard-badge"
          :title="std.url"
        >
          {{ std.name }}
        </span>
        <span v-if="!supportedStandards.length" class="no-standards">
          {{ nullText('Standards') }}
        </span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  ArrowPathIcon, 
  GlobeAltIcon, 
  ChatBubbleLeftRightIcon 
} from '@heroicons/vue/24/outline'
import { useNftStore } from '../stores/nftStore'

const store = useNftStore()

// Destructure store state and actions
const {
  collectionName,
  collectionSymbol,
  collectionDescription,
  collectionLogo,
  collectionSupplyCap,
  supportedStandards,
  customMetadata,
  totalCount,
  collectionLoading,
  refreshing,
  refresh
} = store

// Local state
const logoLoaded = ref(false)
const logoSrc = ref('')
const descExpanded = ref(false)

// Computed
const hasSocialLinks = computed(() => {
  return customMetadata && customMetadata.some(([key]) => isSocialLink(key))
})

// Methods
const nullText = (field: string) => `${field}: null`

const isSocialLink = (key: string) => {
  const lowerKey = key.toLowerCase()
  return lowerKey.includes('website') || lowerKey.includes('web') || lowerKey.includes('twitter') || lowerKey.includes('discord')
}

const getSocialIcon = (key: string) => {
  const lowerKey = key.toLowerCase()
  if (lowerKey.includes('discord')) return ChatBubbleLeftRightIcon
  return GlobeAltIcon
}

const renderDescription = () => {
  const desc = collectionDescription || ''
  if (!desc) return nullText('Description')
  if (desc.length <= 120) return desc
  if (descExpanded.value) return `${desc} <button class="text-accent underline text-xs ml-1" @click="descExpanded = false">less</button>`
  return `${desc.slice(0, 120)}... <button class="text-accent underline text-xs ml-1" @click="descExpanded = true">more</button>`
}

// Logo loading logic
const loadLogo = async () => {
  if (!collectionLogo) {
    logoLoaded.value = true
    logoSrc.value = ''
    return
  }

  try {
    logoSrc.value = collectionLogo
    const img = new Image()
    img.onload = () => {
      logoLoaded.value = true
    }
    img.onerror = () => {
      logoLoaded.value = true
    }
    img.src = collectionLogo
  } catch (error) {
    logoSrc.value = collectionLogo
    logoLoaded.value = true
  }
}

// Watch for logo changes using a computed
const logoToWatch = computed(() => collectionLogo)
watch(logoToWatch, (newLogo) => {
  logoLoaded.value = false
  logoSrc.value = ''
  if (newLogo) {
    loadLogo()
  }
})

onMounted(() => {
  loadLogo()
})
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 