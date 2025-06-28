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
/* Collection Banner Component */
.collection-banner {
  position: relative;
  width: 100%;
  padding: var(--spacing-2xl) var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: var(--radius-2xl);
  min-height: 320px;
  display: grid;
  grid-template-rows: 1fr 120px;
  grid-template-columns: 1fr 1fr;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.collection-banner::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
  opacity: 0.5;
  z-index: -1;
  animation: bannerGlow 8s ease-in-out infinite alternate;
}

@keyframes bannerGlow {
  0% {
    opacity: 0.3;
  }
  100% {
    opacity: 0.7;
  }
}

@media (min-width: 768px) {
  .collection-banner {
    padding: var(--spacing-3xl) var(--spacing-lg);
  }
}

.refresh-button {
  position: absolute;
  top: var(--spacing-lg);
  right: var(--spacing-lg);
  z-index: 100;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 50%;
  padding: var(--spacing-md);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  color: var(--text-accent);
  cursor: pointer;
  border: 1px solid transparent;
}

.refresh-button:hover {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
  transform: scale(1.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 20px rgba(139, 92, 246, 0.3);
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.refresh-button:active {
  transform: scale(0.95);
}

.refresh-icon {
  width: 24px;
  height: 24px;
  transition: transform 0.3s ease;
}

.refresh-icon.spinning {
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

.banner-left {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: var(--spacing-xl);
  grid-row: 2;
  grid-column: 1;
  padding-left: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 96px;
  min-height: 96px;
  position: relative;
}

.logo-container::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  border-radius: var(--radius-xl);
  opacity: 0.3;
  z-index: -1;
}

.collection-logo {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: var(--radius-xl);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: white;
  transition: all 0.3s ease;
}

.collection-logo:hover {
  transform: scale(1.05);
  box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.25);
}

.logo-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xl);
  background: var(--bg-tertiary);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 2px solid rgba(255, 255, 255, 0.1);
  width: 96px;
  height: 96px;
}

.logo-loading .loading-spinner {
  width: 32px;
  height: 32px;
}

.logo-placeholder {
  border-radius: var(--radius-xl);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 2px solid rgba(255, 255, 255, 0.1);
  width: 96px;
  height: 96px;
}

.placeholder-text {
  font-size: var(--font-size-3xl);
  font-weight: bold;
  color: var(--text-muted);
}

.collection-info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: var(--spacing-sm) 0;
  min-width: 0;
}

.collection-header {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.collection-name {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--text-white);
  line-height: 1.2;
  letter-spacing: -0.025em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

@media (min-width: 768px) {
  .collection-name {
    font-size: var(--font-size-3xl);
  }
}

.collection-symbol {
  margin-left: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(139, 92, 246, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-accent);
  display: inline-block;
  vertical-align: baseline;
  letter-spacing: 0.05em;
  transition: all 0.3s ease;
}

.collection-symbol:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.collection-description {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  max-width: 320px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.5;
}

.social-links {
  display: flex;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
  align-items: center;
  margin-top: var(--spacing-sm);
}

.social-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-accent);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: 600;
  transition: all 0.3s ease;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid transparent;
}

.social-link:hover {
  color: var(--text-accent-light);
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-1px);
}

.social-icon {
  width: 16px;
  height: 16px;
}

.no-social-links {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}

.banner-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  grid-row: 2;
  grid-column: 2;
  padding-right: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
}

.collection-stats {
  display: flex;
  margin-bottom: var(--spacing-xs);
  gap: 6rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 100px;
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: bold;
  color: var(--text-white);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: -0.025em;
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 500;
}

.standards-container {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  margin-top: var(--spacing-md);
  justify-content: flex-end;
}

.standard-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: rgba(139, 92, 246, 0.15);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: var(--text-accent);
  border-radius: 9999px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  border: 1px solid rgba(139, 92, 246, 0.3);
  letter-spacing: 0.05em;
  transition: all 0.3s ease;
}

.standard-badge:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.no-standards {
  color: var(--text-muted);
  font-size: var(--font-size-xs);
}

/* Mobile styles for Collection Banner */
@media (max-width: 768px) {
  .collection-banner {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    min-height: 420px;
    padding: var(--spacing-xl) var(--spacing-md) var(--spacing-lg) var(--spacing-md);
    border-radius: var(--radius-lg);
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  }
  .refresh-button {
    top: var(--spacing-md);
    right: var(--spacing-md);
    width: 40px;
    height: 40px;
    padding: 0;
  }
  .banner-left {
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: var(--spacing-md);
    padding: 0;
    margin-bottom: var(--spacing-lg);
    grid-row: unset;
    grid-column: unset;
  }
  .logo-container {
    min-width: 72px;
    min-height: 72px;
    width: 72px;
    height: 72px;
  }
  .collection-logo, .logo-loading, .logo-placeholder {
    width: 72px;
    height: 72px;
    border-radius: var(--radius-lg);
  }
  .collection-info {
    align-items: center;
    text-align: center;
    padding: 0;
    min-width: 0;
  }
  .collection-header {
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-xs);
  }
  .collection-name {
    font-size: var(--font-size-lg);
  }
  .collection-symbol {
    margin-left: 0;
    margin-top: var(--spacing-xs);
    font-size: var(--font-size-base);
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  .collection-description {
    max-width: 100%;
    font-size: var(--font-size-xs);
    margin-bottom: 2px;
    white-space: normal;
  }
  .social-links {
    justify-content: center;
    gap: var(--spacing-md);
    margin-top: var(--spacing-xs);
  }
  .banner-right {
    align-items: center;
    justify-content: flex-start;
    padding: 0;
    gap: var(--spacing-xs);
    grid-row: unset;
    grid-column: unset;
  }
  .collection-stats {
    flex-direction: row;
    gap: var(--spacing-xl);
    margin-bottom: var(--spacing-xs);
  }
  .stat-item {
    align-items: center;
    min-width: 70px;
  }
  .stat-value {
    font-size: var(--font-size-lg);
  }
  .stat-label {
    font-size: var(--font-size-xxs);
  }
  .standards-container {
    justify-content: center;
    gap: var(--spacing-xs);
    margin-top: var(--spacing-xs);
  }
  .standard-badge {
    font-size: var(--font-size-xxs);
    padding: var(--spacing-xxs) var(--spacing-xs);
  }
}
</style> 