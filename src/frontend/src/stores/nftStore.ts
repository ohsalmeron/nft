import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createActor } from '../../../core_nft/api/declarations'

const MAINNET_CANISTER_ID = "xea2t-daaaa-aaaaj-qnp2a-cai"
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const CACHE_VERSION = 'v1'
const COLLECTION_CACHE_KEY = 'collection_metadata'

// Cache utilities
const cacheUtils = {
  get: (key: string) => {
    try {
      const item = localStorage.getItem(`nft_cache_${CACHE_VERSION}_${key}`)
      if (!item) return null
      const { data, timestamp, version } = JSON.parse(item)
      if (Date.now() - timestamp > CACHE_DURATION || version !== CACHE_VERSION) {
        localStorage.removeItem(`nft_cache_${CACHE_VERSION}_${key}`)
        return null
      }
      return data
    } catch (error) {
      return null
    }
  },

  set: (key: string, data: any) => {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION
      }
      localStorage.setItem(`nft_cache_${CACHE_VERSION}_${key}`, JSON.stringify(item))
    } catch (error) {
      console.error('Cache write failed:', error)
    }
  },

  clear: (key: string) => {
    try {
      localStorage.removeItem(`nft_cache_${CACHE_VERSION}_${key}`)
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  },

  clearAll: () => {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(`nft_cache_${CACHE_VERSION}_`))
        .forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.error('Cache clearAll error:', error)
    }
  }
}

// Helper to convert BigInt to string
function convertBigIntToString(obj: any): any {
  if (typeof obj === 'bigint') {
    return obj.toString()
  } else if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString)
  } else if (obj && typeof obj === 'object') {
    const newObj: any = {}
    for (const key in obj) {
      newObj[key] = convertBigIntToString(obj[key])
    }
    return newObj
  }
  return obj
}

export const useNftStore = defineStore('nft', () => {
  // Collection metadata state
  const collectionName = ref('')
  const collectionSymbol = ref('')
  const collectionDescription = ref('')
  const collectionLogo = ref('')
  const collectionSupplyCap = ref<number | null>(null)
  const supportedStandards = ref<any[]>([])
  const customMetadata = ref<any[]>([])
  const totalCount = ref(0)
  const collectionLoading = ref(false)

  // NFT state
  const nfts = ref<any[]>([])
  const loading = ref(true)
  const loadingMore = ref(false)
  const hasMore = ref(true)
  const page = ref(1)
  const pageSize = ref(24)

  // UI state
  const selectedNft = ref<any>(null)
  const showModal = ref(false)
  const refreshing = ref(false)

  // Initialize from cache
  const cached = cacheUtils.get(COLLECTION_CACHE_KEY)
  if (cached) {
    collectionName.value = cached.name || ''
    collectionSymbol.value = cached.symbol || ''
    collectionDescription.value = cached.description || ''
    collectionLogo.value = cached.logo || ''
    collectionSupplyCap.value = cached.supplyCap || null
    supportedStandards.value = cached.standards || []
    customMetadata.value = cached.customMetadata || []
    totalCount.value = cached.totalCount || 0
    collectionLoading.value = false
  } else {
    collectionLoading.value = true
  }

  // Fetch collection metadata
  const fetchCollectionMetadata = async () => {
    if (!collectionLoading.value) return
    
    collectionLoading.value = true
    try {
      const mainnetActor = createActor(MAINNET_CANISTER_ID, { 
        agentOptions: { host: "https://icp0.io" } 
      })
      
      const [name, symbol, descriptionOpt, logoOpt, supplyCapOpt, standards, customMeta, count] = await Promise.all([
        mainnetActor.icrc7_name(),
        mainnetActor.icrc7_symbol(),
        mainnetActor.icrc7_description(),
        mainnetActor.icrc7_logo(),
        mainnetActor.icrc7_supply_cap(),
        mainnetActor.icrc10_supported_standards(),
        mainnetActor.icrc7_collection_metadata(),
        mainnetActor.icrc7_total_supply(),
      ])

      collectionName.value = name
      collectionSymbol.value = symbol
      collectionDescription.value = descriptionOpt?.[0] || ""
      collectionLogo.value = logoOpt?.[0] || ""
      collectionSupplyCap.value = supplyCapOpt?.[0] || null
      supportedStandards.value = standards
      customMetadata.value = customMeta
      totalCount.value = Number(count)

      // Cache the data
      const cacheData = convertBigIntToString({
        name,
        symbol,
        description: descriptionOpt?.[0] || "",
        logo: logoOpt?.[0] || "",
        supplyCap: supplyCapOpt?.[0] || null,
        standards,
        customMetadata: customMeta,
        totalCount: Number(count),
      })
      cacheUtils.set(COLLECTION_CACHE_KEY, cacheData)
    } catch (e) {
      console.error('Failed to fetch collection metadata:', e)
    }
    collectionLoading.value = false
  }

  // Fetch NFTs
  const fetchNFTs = async (useCache = true) => {
    const CACHE_KEY = `nfts_page_${page.value}_size_${pageSize.value}`
    
    if (useCache) {
      const cachedNfts = cacheUtils.get(CACHE_KEY)
      if (cachedNfts) {
        nfts.value = [...nfts.value, ...cachedNfts]
        loading.value = false
        loadingMore.value = false
        if (cachedNfts.length < pageSize.value) hasMore.value = false
        return
      }
    }

    if (page.value === 1) loading.value = true
    else loadingMore.value = true

    try {
      const mainnetActor = createActor(MAINNET_CANISTER_ID, { 
        agentOptions: { host: "https://icp0.io" } 
      })
      
      const start = (page.value - 1) * pageSize.value
      const end = start + pageSize.value
      const allTokenIds = await mainnetActor.icrc7_tokens([], [])
      const pageTokenIds = allTokenIds.slice(start, end)
      const metadatas = await mainnetActor.icrc7_token_metadata(pageTokenIds)
      
      const parsed = await Promise.all(
        pageTokenIds.map(async (id: any, idx: number) => {
          const tokenId = typeof id === 'bigint' ? id.toString() : id
          const meta = metadatas[idx]?.[0]
          
          // Try NFT-level cache
          const nftCacheKey = `nft_${tokenId}`
          const cachedNft = cacheUtils.get(nftCacheKey)
          if (cachedNft) return cachedNft
          
          // Process NFT data
          let metadataUrl = null
          if (meta) {
            for (const [key, value] of meta) {
              if (key === "icrc97:metadata" && value.Array) {
                const urlValue = value.Array[0]
                if (urlValue && urlValue.Text) {
                  metadataUrl = urlValue.Text
                  break
                }
              }
            }
          }
          
          if (!metadataUrl) {
            const fallback = {
              id: tokenId,
              name: `NFT #${tokenId}`,
              description: "No metadata available",
              image: "",
              attributes: [],
              metadataUrl: null
            }
            cacheUtils.set(nftCacheKey, fallback)
            return fallback
          }
          
          try {
            // Check cache for metadata
            const metadataCacheKey = `nft_metadata_${tokenId}`
            let jsonMetadata = cacheUtils.get(metadataCacheKey)
            if (!jsonMetadata) {
              const response = await fetch(metadataUrl)
              jsonMetadata = await response.json()
              cacheUtils.set(metadataCacheKey, jsonMetadata)
            }
            
            const nftData = {
              id: tokenId,
              name: jsonMetadata.name || `NFT #${tokenId}`,
              description: jsonMetadata.description || "",
              image: jsonMetadata.image || "",
              attributes: jsonMetadata.attributes || [],
              metadataUrl
            }
            cacheUtils.set(nftCacheKey, nftData)
            return nftData
          } catch (fetchError) {
            const fallback = {
              id: tokenId,
              name: `NFT #${tokenId}`,
              description: "Failed to load metadata",
              image: "",
              attributes: [],
              metadataUrl: null
            }
            cacheUtils.set(nftCacheKey, fallback)
            return fallback
          }
        })
      )
      
      const validNfts = parsed.filter(Boolean)
      nfts.value = [...nfts.value, ...validNfts]
      cacheUtils.set(CACHE_KEY, validNfts)
      
      if (validNfts.length < pageSize.value) hasMore.value = false
    } catch (e) {
      console.error('Failed to fetch NFTs:', e)
      hasMore.value = false
    }
    
    loading.value = false
    loadingMore.value = false
  }

  // Load more NFTs
  const loadMore = async () => {
    if (!hasMore.value || loading.value || loadingMore.value) return
    page.value++
    await fetchNFTs(true)
  }

  // Refresh everything
  const refresh = async () => {
    refreshing.value = true
    cacheUtils.clearAll()
    collectionLoading.value = true
    nfts.value = []
    page.value = 1
    hasMore.value = true
    loading.value = true
    
    await Promise.all([
      fetchCollectionMetadata(),
      fetchNFTs(false)
    ])
    
    refreshing.value = false
  }

  // NFT modal actions
  const openNftModal = (nft: any) => {
    selectedNft.value = nft
    showModal.value = true
  }

  const closeNftModal = () => {
    showModal.value = false
    selectedNft.value = null
  }

  // Computed properties
  const collectionData = computed(() => ({
    name: collectionName.value,
    symbol: collectionSymbol.value,
    description: collectionDescription.value,
    logo: collectionLogo.value,
    supplyCap: collectionSupplyCap.value,
    standards: supportedStandards.value,
    customMetadata: customMetadata.value,
    totalCount: totalCount.value,
    loading: collectionLoading.value
  }))

  return {
    // State
    collectionName,
    collectionSymbol,
    collectionDescription,
    collectionLogo,
    collectionSupplyCap,
    supportedStandards,
    customMetadata,
    totalCount,
    collectionLoading,
    nfts,
    loading,
    loadingMore,
    hasMore,
    selectedNft,
    showModal,
    refreshing,
    
    // Actions
    fetchCollectionMetadata,
    fetchNFTs,
    loadMore,
    refresh,
    openNftModal,
    closeNftModal,
    
    // Computed
    collectionData
  }
}) 