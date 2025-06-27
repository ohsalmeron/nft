import { useEffect, useState, useCallback, useRef } from "react";
import { createActor } from "../../core_nft/api/declarations";
import NftCard from "./components/NftCard";
import NftModal from "./components/NftModal";

const MAINNET_CANISTER_ID = "xea2t-daaaa-aaaaj-qnp2a-cai";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Dynamic page size calculation based on viewport and grid
function calculatePageSize() {
  const width = window.innerWidth;
  let columns = 1; // Default for mobile
  let rows = 2; // Default rows for mobile

  if (width >= 1536) columns = 8;
  else if (width >= 1280) columns = 6;
  else if (width >= 1024) columns = 4;
  else if (width >= 768) columns = 3;
  else if (width >= 640) columns = 2;
  else columns = 1;

  // Use more rows for desktop
  if (width >= 768) rows = 4;
  // Mobile stays at 2 rows

  return columns * rows;
}

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
      const img = new window.Image();
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
      return null;
    }
  },
  set: (key, data) => {
    try {
      const item = { data, timestamp: Date.now() };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {}
  },
  clear: (key) => {
    try { localStorage.removeItem(key); } catch (error) {}
  }
};

function App() {
  const [nfts, setNfts] = useState([]); // All loaded NFTs
  const [loading, setLoading] = useState(true);
  const [selectedNft, setSelectedNft] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1); // Current page to load next
  const [pageSize, setPageSize] = useState(calculatePageSize());
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef();
  
  const { loadImage, imageCache, loadingImages } = useImageCache();

  // Responsive page size calculation
  useEffect(() => {
    const handleResize = () => {
      const newPageSize = calculatePageSize();
      if (newPageSize !== pageSize) {
        setPageSize(newPageSize);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pageSize]);

  // Fetch total count once
  useEffect(() => {
    async function fetchTotalCount() {
      try {
        const mainnetActor = createActor(MAINNET_CANISTER_ID, { agentOptions: { host: "https://icp0.io" } });
        const count = await mainnetActor.icrc7_total_supply();
        setTotalCount(Number(count));
      } catch (e) {
        setTotalCount(0);
      }
    }
    fetchTotalCount();
  }, []);

  // Fetch NFTs for a page and append
  const fetchNFTs = useCallback(async (page, pageSize, useCache = true) => {
    const CACHE_KEY = `nft_collection_page_${page}_size_${pageSize}`;
    if (useCache) {
      const cachedNfts = cacheUtils.get(CACHE_KEY);
      if (cachedNfts) {
        setNfts(prev => {
          // Avoid duplicates
          const ids = new Set(prev.map(n => n.id));
          return [...prev, ...cachedNfts.filter(n => !ids.has(n.id))];
        });
        setLoading(false);
        setLoadingMore(false);
        if (cachedNfts.length < pageSize) setHasMore(false);
        return;
      }
    }
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const mainnetActor = createActor(MAINNET_CANISTER_ID, { agentOptions: { host: "https://icp0.io" } });
      // Get all token IDs for this page
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const allTokenIds = await mainnetActor.icrc7_tokens([], []);
      const pageTokenIds = allTokenIds.slice(start, end);
      const metadatas = await mainnetActor.icrc7_token_metadata(pageTokenIds);
      const parsed = await Promise.all(
        pageTokenIds.map(async (id, idx) => {
          const tokenId = typeof id === 'bigint' ? id.toString() : id;
          const meta = metadatas[idx]?.[0];
          if (!meta) return null;
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
      setNfts(prev => {
        // Avoid duplicates
        const ids = new Set(prev.map(n => n.id));
        return [...prev, ...validNfts.filter(n => !ids.has(n.id))];
      });
      cacheUtils.set(CACHE_KEY, validNfts);
      // Preload images for this page
      validNfts.forEach(nft => {
        if (nft.image) {
          loadImage(nft.image).catch(() => {});
        }
      });
      if (validNfts.length < pageSize) setHasMore(false);
    } catch (e) {
      setHasMore(false);
    }
    setLoading(false);
    setLoadingMore(false);
  }, [loadImage]);

  // Initial load and reset on pageSize change
  useEffect(() => {
    setNfts([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
  }, [pageSize]);

  // Load first page or next page
  useEffect(() => {
    if (hasMore) {
      fetchNFTs(page, pageSize, true);
    }
  }, [fetchNFTs, page, pageSize, hasMore]);

  // Infinite scroll: observe the sentinel
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const observer = new window.IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setPage(p => p + 1);
        }
      },
      { threshold: 1 }
    );
    if (observerRef.current) {
      observer.observe(observerRef.current);
    }
    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, loading, loadingMore]);

  // Refresh function (clears all loaded pages)
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Clear all page caches
    for (let i = 1; i <= page; i++) {
      const CACHE_KEY = `nft_collection_page_${i}_size_${pageSize}`;
      cacheUtils.clear(CACHE_KEY);
    }
    setNfts([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    await fetchNFTs(1, pageSize, false);
    setRefreshing(false);
  }, [fetchNFTs, page, pageSize]);

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
      </header>
      <main className="p-xl max-w-7xl mx-auto">
        {loading && page === 1 ? (
          <div className="text-center p-2xl">
            <div className="loading-spinner"></div>
            <p className="text-secondary mt-md">Loading NFT collection...</p>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-lg p-md">
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
            {/* Infinite scroll sentinel */}
            <div ref={observerRef} style={{ height: 1 }}></div>
            {loadingMore && (
              <div className="flex justify-center py-lg">
                <div className="loading-spinner"></div>
              </div>
            )}
            {!hasMore && nfts.length > 0 && (
              <div className="text-center text-muted py-lg">No more NFTs to load.</div>
            )}
          </>
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
