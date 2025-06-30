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

// Image cache utilities
const imageCache = new Map<string, string>()
const loadingImages = new Set<string>()

const loadImage = async (src: string): Promise<string> => {
  if (imageCache.has(src)) {
    return imageCache.get(src)!
  }

  if (loadingImages.has(src)) {
    return new Promise((resolve) => {
      const checkLoaded = () => {
        if (imageCache.has(src)) {
          resolve(imageCache.get(src)!)
        } else {
          setTimeout(checkLoaded, 100)
        }
      }
      checkLoaded()
    })
  }

  loadingImages.add(src)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      imageCache.set(src, img.src)
      loadingImages.delete(src)
      resolve(img.src)
    }
    img.onerror = () => {
      loadingImages.delete(src)
      reject(new Error(`Failed to load image: ${src}`))
    }
    img.src = src
  })
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

  // Image cache state
  const imageCacheSize = ref(0)
  const loadingImagesCount = ref(0)

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

  // Update image cache stats
  const updateImageCacheStats = () => {
    imageCacheSize.value = imageCache.size
    loadingImagesCount.value = loadingImages.size
  }

  // Expose image cache utilities
  const isImageLoaded = (src: string) => {
    const loaded = imageCache.has(src)
    // Trigger reactivity by accessing the reactive state
    imageCacheSize.value
    return loaded
  }
  const isImageLoading = (src: string) => {
    const loading = loadingImages.has(src)
    // Trigger reactivity by accessing the reactive state
    loadingImagesCount.value
    return loading
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

      collectionName.value = name as string
      collectionSymbol.value = symbol as string
      collectionDescription.value = Array.isArray(descriptionOpt) && descriptionOpt.length > 0 ? (descriptionOpt[0] as string) : ""
      collectionLogo.value = Array.isArray(logoOpt) && logoOpt.length > 0 ? (logoOpt[0] as string) : ""
      collectionSupplyCap.value = Array.isArray(supplyCapOpt) && supplyCapOpt.length > 0 ? (supplyCapOpt[0] as number | null) : null
      supportedStandards.value = standards as any[]
      customMetadata.value = customMeta as any[]
      totalCount.value = Number(count)

      // Cache the data
      const cacheData = convertBigIntToString({
        name,
        symbol,
        description: Array.isArray(descriptionOpt) && descriptionOpt.length > 0 ? descriptionOpt[0] : "",
        logo: Array.isArray(logoOpt) && logoOpt.length > 0 ? logoOpt[0] : "",
        supplyCap: Array.isArray(supplyCapOpt) && supplyCapOpt.length > 0 ? supplyCapOpt[0] : null,
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
      const allTokenIds = (await mainnetActor.icrc7_tokens([], [])) as any[]
      const pageTokenIds = Array.isArray(allTokenIds) ? allTokenIds.slice(start, end) : []
      const metadatas = (await mainnetActor.icrc7_token_metadata(pageTokenIds)) as any[]
      
      const parsed = await Promise.all(
        pageTokenIds.map(async (id: any, idx: number) => {
          const tokenId = typeof id === 'bigint' ? id.toString() : id
          const nftCacheKey = `nft_${tokenId}`;
          const cachedNft = cacheUtils.get(nftCacheKey);
          if (cachedNft) return cachedNft;

          const metaOpt = metadatas[idx]; // Option: null or array
          console.log(`Token ${tokenId} metaOpt:`, metaOpt);
          
          let metadataUrl = null;
          if (Array.isArray(metaOpt) && metaOpt.length > 0) {
            console.log(`Token ${tokenId} metaOpt array:`, metaOpt);
            // metaOpt is an array containing another array, so get the inner array
            const innerArray = metaOpt[0];
            if (Array.isArray(innerArray)) {
              console.log(`Token ${tokenId} innerArray:`, innerArray);
              for (const [key, value] of innerArray) {
                console.log(`Token ${tokenId} checking key:`, key, 'value:', value);
                if (key === "icrc97:metadata" && value && Array.isArray(value.Array)) {
                  const urlValue = value.Array[0];
                  console.log(`Token ${tokenId} urlValue:`, urlValue);
                  if (urlValue && typeof urlValue === "object" && "Text" in urlValue) {
                    metadataUrl = urlValue.Text;
                    console.log(`Token ${tokenId} found metadataUrl:`, metadataUrl);
                    break;
                  }
                }
              }
            }
          }
        
          if (!metadataUrl) {
            console.log(`Token ${tokenId} no metadata URL found`);
            const fallback = {
              id: tokenId,
              name: `NFT #${tokenId}`,
              description: "No metadata available",
              image: "",
              attributes: [],
              metadataUrl: null
            };
            cacheUtils.set(nftCacheKey, fallback);
            return fallback;
          }

          try {
            // Check cache for metadata
            const metadataCacheKey = `nft_metadata_${tokenId}`;
            let jsonMetadata = cacheUtils.get(metadataCacheKey);
            if (!jsonMetadata) {
              console.log(`Token ${tokenId} fetching metadata from:`, metadataUrl);
              const response = await fetch(metadataUrl);
              jsonMetadata = await response.json();
              console.log(`Token ${tokenId} fetched JSON metadata:`, jsonMetadata);
              cacheUtils.set(metadataCacheKey, jsonMetadata);
            }

            const nftData = {
              id: tokenId,
              name: jsonMetadata.name || `NFT #${tokenId}`,
              description: jsonMetadata.description || "",
              image: jsonMetadata.image || "",
              attributes: jsonMetadata.attributes || [],
              metadataUrl
            };
            console.log(`Token ${tokenId} final NFT data:`, nftData);
            cacheUtils.set(nftCacheKey, nftData);
            return nftData;
          } catch (fetchError) {
            console.error(`Token ${tokenId} fetch error:`, fetchError);
            const fallback = {
              id: tokenId,
              name: `NFT #${tokenId}`,
              description: "Failed to load metadata",
              image: "",
              attributes: [],
              metadataUrl: null
            };
            cacheUtils.set(nftCacheKey, fallback);
            return fallback;
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
    
    // Clear image cache
    imageCache.clear()
    loadingImages.clear()
    updateImageCacheStats()
    
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

  // Fetch NFT owner by tokenId
  const fetchNftOwner = async (tokenId: string | number, canisterId?: string): Promise<string | null> => {
    const cacheKey = `nft_owner_${tokenId}`
    const cached = cacheUtils.get(cacheKey)
    if (cached) return cached
    try {
      const actor = createActor(canisterId || MAINNET_CANISTER_ID, { agentOptions: { host: "https://icp0.io" } })
      // icrc7_owner_of expects an array of Nat (token ids)
      const ids = [typeof tokenId === 'string' ? BigInt(tokenId) : BigInt(tokenId)]
      const result = await actor.icrc7_owner_of(ids)
      // result is Vec<Option<Account>>
      if (Array.isArray(result) && result.length > 0 && result[0] && result[0].owner) {
        const principal = result[0].owner.toString()
        cacheUtils.set(cacheKey, principal)
        return principal
      }
    } catch (e) {
      console.error('Failed to fetch NFT owner:', e)
    }
    return null
  }

  // Fetch NFT transaction history (ICRC3)
  const fetchNftTransactionHistory = async (
    tokenId: string | number,
    { start = 0, length = 100 } = {}
  ): Promise<any[]> => {
    const cacheKey = `nft_tx_history_${tokenId}_${start}_${length}`
    const cached = cacheUtils.get(cacheKey)
    if (cached) return cached
    try {
      const actor = createActor(MAINNET_CANISTER_ID, { agentOptions: { host: "https://icp0.io" } })
      const req = [{ start: BigInt(start), length: BigInt(length) }]
      const result = await actor.icrc3_get_blocks(req) as any
      // result.blocks: [{ id, block }]
      // block is a generic ICRC3Value, need to parse for tokenId
      const txs = ((result.blocks || []) as any[]).map((b: any) => ({ id: b.id, ...b.block }))
      // Filter for this tokenId (look for tid or token_id in block)
      const filtered = txs.filter((tx: any) => {
        // Try to find token id in the block (ICRC3Value)
        if (tx.Map) {
          const tid = tx.Map.find(([k, v]: any) => k === 'tid' && (v.Nat || v.Int))
          if (tid && (tid[1].Nat?.toString() === tokenId.toString() || tid[1].Int?.toString() === tokenId.toString())) {
            return true
          }
        }
        return false
      })
      // Parse for UI: type, from, to, timestamp, memo, etc.
      const parsed = filtered.map((tx: any) => {
        let type = ''
        let from = ''
        let to = ''
        let timestamp = ''
        let memo = ''
        if (tx.Map) {
          for (const [k, v] of tx.Map) {
            if (k === 'type' && v.Text) type = v.Text
            if (k === 'from' && v.Map) {
              const owner = v.Map.find(([kk]: any) => kk === 'owner')
              if (owner && owner[1].Text) from = owner[1].Text
            }
            if (k === 'to' && v.Map) {
              const owner = v.Map.find(([kk]: any) => kk === 'owner')
              if (owner && owner[1].Text) to = owner[1].Text
            }
            if (k === 'created_at_time' && (v.Nat || v.Int)) timestamp = (v.Nat || v.Int).toString()
            if (k === 'memo' && v.Text) memo = v.Text
          }
        }
        return { id: tx.id, type, from, to, timestamp, memo, raw: tx }
      })
      cacheUtils.set(cacheKey, parsed)
      return parsed
    } catch (e) {
      console.error('Failed to fetch NFT transaction history:', e)
      return []
    }
  }

  // Fetch NFT approvals (ICRC37)
  const fetchNftApprovals = async (tokenId: string | number): Promise<any[]> => {
    const cacheKey = `nft_approvals_${tokenId}`
    const cached = cacheUtils.get(cacheKey)
    if (cached) return cached
    try {
      const actor = createActor(MAINNET_CANISTER_ID, { agentOptions: { host: "https://icp0.io" } })
      const result = await actor.icrc37_get_token_approvals(BigInt(tokenId), null, null) as any[]
      // result: array of approvals
      cacheUtils.set(cacheKey, result)
      return result
    } catch (e) {
      console.error('Failed to fetch NFT approvals:', e)
      return []
    }
  }

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
    imageCacheSize,
    loadingImagesCount,
    
    // Actions
    fetchCollectionMetadata,
    fetchNFTs,
    loadMore,
    refresh,
    openNftModal,
    closeNftModal,
    
    // Image cache utilities
    isImageLoaded,
    isImageLoading,
    
    // Computed
    collectionData,
    fetchNftOwner,
    fetchNftTransactionHistory,
    fetchNftApprovals
  }
})