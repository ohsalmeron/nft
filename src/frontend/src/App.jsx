import { useEffect, useState, useCallback } from "react";
import { createActor } from "../../core_nft/api/declarations";
import NftCard from "./components/NftCard";
import NftModal from "./components/NftModal";

const MAINNET_CANISTER_ID = "xea2t-daaaa-aaaaj-qnp2a-cai";
const CACHE_KEY = "nft_collection_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Custom hook for image caching
function useImageCache() {
  const [imageCache, setImageCache] = useState(new Map());
  const [loadingImages, setLoadingImages] = useState(new Set());

  const loadImage = useCallback((src) => {
    if (imageCache.has(src)) {
      return Promise.resolve(imageCache.get(src));
    }

    if (loadingImages.has(src)) {
      return new Promise((resolve) => {
        const checkLoaded = () => {
          if (imageCache.has(src)) {
            resolve(imageCache.get(src));
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });
    }

    setLoadingImages(prev => new Set(prev).add(src));

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        setImageCache(prev => new Map(prev).set(src, img.src));
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
        resolve(img.src);
      };
      img.onerror = () => {
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
        reject(new Error(`Failed to load image: ${src}`));
      };
      img.src = src;
    });
  }, [imageCache, loadingImages]);

  return { loadImage, imageCache, loadingImages };
}

// Cache utilities
const cacheUtils = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const { data, timestamp } = JSON.parse(item);
      if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  set: (key, data) => {
    try {
      const item = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  clear: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
};

function App() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNft, setSelectedNft] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const { loadImage, imageCache, loadingImages } = useImageCache();

  // Load cached data immediately
  useEffect(() => {
    const cachedNfts = cacheUtils.get(CACHE_KEY);
    if (cachedNfts) {
      setNfts(cachedNfts);
      setLoading(false);
      console.log('Loaded from cache:', cachedNfts.length, 'NFTs');
    }
  }, []);

  const fetchNFTs = useCallback(async (useCache = true) => {
    if (useCache) {
      const cachedNfts = cacheUtils.get(CACHE_KEY);
      if (cachedNfts) {
        setNfts(cachedNfts);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const mainnetActor = createActor(MAINNET_CANISTER_ID, {
        agentOptions: {
          host: "https://icp0.io",
        },
      });

      // Get all token IDs
      const tokenIds = await mainnetActor.icrc7_tokens([], []);
      const metadatas = await mainnetActor.icrc7_token_metadata(tokenIds);
      
      // Parse metadata and fetch JSON with caching
      const parsed = await Promise.all(
        tokenIds.map(async (id, idx) => {
          const tokenId = typeof id === 'bigint' ? id.toString() : id;
          
          const meta = metadatas[idx]?.[0];
          if (!meta) return null;
          
          // Find the metadata URL
          let metadataUrl = null;
          for (const [key, value] of meta) {
            if (key === "icrc97:metadata" && value.Array) {
              const urlValue = value.Array[0];
              if (urlValue && urlValue.Text) {
                metadataUrl = urlValue.Text;
                break;
              }
            }
          }
          
          if (!metadataUrl) {
            return { 
              id: tokenId, 
              name: `NFT #${tokenId}`, 
              description: "No metadata available",
              image: "",
              attributes: [],
              metadataUrl: null
            };
          }
          
          try {
            // Check cache for JSON metadata
            const cacheKey = `nft_metadata_${tokenId}`;
            let jsonMetadata = cacheUtils.get(cacheKey);
            
            if (!jsonMetadata) {
              const response = await fetch(metadataUrl);
              jsonMetadata = await response.json();
              cacheUtils.set(cacheKey, jsonMetadata);
            }
            
            return {
              id: tokenId,
              name: jsonMetadata.name || `NFT #${tokenId}`,
              description: jsonMetadata.description || "",
              image: jsonMetadata.image || "",
              attributes: jsonMetadata.attributes || [],
              metadataUrl
            };
          } catch (fetchError) {
            console.error(`Failed to fetch metadata for token ${tokenId}:`, fetchError);
            return { 
              id: tokenId, 
              name: `NFT #${tokenId}`, 
              description: "Failed to load metadata",
              image: "",
              attributes: [],
              metadataUrl: null
            };
          }
        })
      );
      
      const validNfts = parsed.filter(Boolean);
      setNfts(validNfts);
      cacheUtils.set(CACHE_KEY, validNfts);
      
      // Preload images in background
      validNfts.forEach(nft => {
        if (nft.image) {
          loadImage(nft.image).catch(() => {
            // Silently fail for image loading
          });
        }
      });
      
    } catch (e) {
      console.error('Error fetching NFTs:', e);
    }
    setLoading(false);
  }, [loadImage]);

  // Initial fetch
  useEffect(() => {
    fetchNFTs(true);
  }, [fetchNFTs]);

  // Refresh function
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    cacheUtils.clear(CACHE_KEY);
    await fetchNFTs(false);
    setRefreshing(false);
  }, [fetchNFTs]);

  const handleNftClick = (nft) => {
    setSelectedNft(nft);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedNft(null);
  };

  return (
    <div className="min-h-screen">
      <header className="glass p-xl text-center mb-xl">
        <div className="flex justify-between items-center mb-md">
          <h1 className="text-3xl font-bold text-primary">NFT Collection Gallery</h1>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="glass-button px-md py-sm text-sm"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <p className="text-secondary">Explore the complete collection</p>
        {nfts.length > 0 && (
          <p className="text-sm text-muted mt-sm">
            {nfts.length} NFTs loaded • {imageCache.size} images cached
          </p>
        )}
      </header>

      <main className="p-xl max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center p-2xl">
            <div className="loading-spinner"></div>
            <p className="text-secondary mt-md">Loading NFT collection...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-lg p-md">
            {nfts.map((nft) => (
              <NftCard 
                key={nft.id} 
                nft={nft} 
                onClick={handleNftClick}
                imageLoaded={imageCache.has(nft.image)}
                imageLoading={loadingImages.has(nft.image)}
              />
            ))}
          </div>
        )}
      </main>

      <NftModal 
        nft={selectedNft} 
        show={showModal} 
        onClose={closeModal}
        imageLoaded={selectedNft ? imageCache.has(selectedNft.image) : false}
      />
    </div>
  );
}

export default App;
