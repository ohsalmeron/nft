import { useEffect, useState, useCallback, useRef } from "react";
import { createActor } from "../../core_nft/api/declarations";
import NftCard from "./components/NftCard";
import NftModal from "./components/NftModal";
import CollectionBanner from "./components/CollectionBanner";
import { FaSyncAlt, FaGlobe, FaTwitter, FaDiscord } from "react-icons/fa";
import { cacheUtils } from "./utils/cache";
import { imageCache } from "./utils/imageCache";

const MAINNET_CANISTER_ID = "xea2t-daaaa-aaaaj-qnp2a-cai";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_VERSION = 'v1';
const COLLECTION_CACHE_KEY = 'collection_metadata';

// Dynamic page size calculation based on viewport and grid
function calculatePageSize() {
  const width = window.innerWidth;
  let columns = 1; // Default for mobile
  let rows = 8; // Default rows for mobile

  if (width >= 1536) columns = 4;
  else if (width >= 1280) columns = 3;
  else if (width >= 768) columns = 2;
  else columns = 1;

  // Use more rows for desktop
  if (width >= 768) rows = 6;
  // Mobile stays at 4 rows

  return columns * rows;
}

const cached = cacheUtils.get(COLLECTION_CACHE_KEY);

// Helper to recursively convert BigInt to string in an object
function convertBigIntToString(obj) {
  if (typeof obj === 'bigint') {
    return obj.toString();
  } else if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  } else if (obj && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = convertBigIntToString(obj[key]);
    }
    return newObj;
  }
  return obj;
}

function App() {
  const [nfts, setNfts] = useState([]); // All loaded NFTs
  const [loading, setLoading] = useState(true);
  const [selectedNft, setSelectedNft] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1); // Current page to load next
  const [pageSize, setPageSize] = useState(calculatePageSize());
  const [totalCount, setTotalCount] = useState(cached?.totalCount || 0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef();

  // Always use cached values for initial state
  const [collectionName, setCollectionName] = useState(cached?.name || "");
  const [collectionSymbol, setCollectionSymbol] = useState(cached?.symbol || "");
  const [collectionDescription, setCollectionDescription] = useState(cached?.description || "");
  const [collectionLogo, setCollectionLogo] = useState(cached?.logo || "");
  const [collectionSupplyCap, setCollectionSupplyCap] = useState(cached?.supplyCap || null);
  const [supportedStandards, setSupportedStandards] = useState(cached?.standards || []);
  const [customMetadata, setCustomMetadata] = useState(cached?.customMetadata || []);
  const [collectionLoading, setCollectionLoading] = useState(() => !cached);
  const [descExpanded, setDescExpanded] = useState(false);

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

  // On app start, clear cache if expired
  useEffect(() => {
    const checkCacheValidity = async () => {
      const lastUpdated = localStorage.getItem('nft_cache_last_updated');
      const now = Date.now();
      if (!lastUpdated || (now - parseInt(lastUpdated)) > CACHE_DURATION) {
        cacheUtils.clearAll();
        await imageCache.clearCache();
        localStorage.setItem('nft_cache_last_updated', now.toString());
      }
    };
    checkCacheValidity();
  }, []);

  // Fetch from network only if no valid cache
  useEffect(() => {
    if (!collectionLoading) return;
    async function fetchCollectionMetadata() {
      setCollectionLoading(true);
      try {
        const mainnetActor = createActor(MAINNET_CANISTER_ID, { agentOptions: { host: "https://icp0.io" } });
        const [name, symbol, descriptionOpt, logoOpt, supplyCapOpt, standards, customMeta, count] = await Promise.all([
          mainnetActor.icrc7_name(),
          mainnetActor.icrc7_symbol(),
          mainnetActor.icrc7_description(),
          mainnetActor.icrc7_logo(),
          mainnetActor.icrc7_supply_cap(),
          mainnetActor.icrc10_supported_standards(),
          mainnetActor.icrc7_collection_metadata(),
          mainnetActor.icrc7_total_supply(),
        ]);
        setCollectionName(name);
        setCollectionSymbol(symbol);
        setCollectionDescription(descriptionOpt?.[0] || "");
        setCollectionLogo(logoOpt?.[0] || "");
        setCollectionSupplyCap(supplyCapOpt?.[0] || null);
        setSupportedStandards(standards);
        setCustomMetadata(customMeta);
        setTotalCount(Number(count));
        // Convert BigInt to string before caching
        const cacheData = convertBigIntToString({
          name,
          symbol,
          description: descriptionOpt?.[0] || "",
          logo: logoOpt?.[0] || "",
          supplyCap: supplyCapOpt?.[0] || null,
          standards,
          customMetadata: customMeta,
          totalCount: Number(count),
        });
        cacheUtils.set(COLLECTION_CACHE_KEY, cacheData);
        console.log('WROTE TO CACHE:', cacheUtils.get(COLLECTION_CACHE_KEY));
        console.log('RAW LOCALSTORAGE:', localStorage.getItem('nft_cache_v1_collection_metadata'));
      } catch (e) {
        // On fetch failure, DO NOT clear state or cache. Always keep the last cached values.
      }
      setCollectionLoading(false);
    }
    fetchCollectionMetadata();
  }, [collectionLoading]);

  // Force cache to be written from state on every render if collectionName is non-empty
  useEffect(() => {
    if (collectionName && collectionName !== "") {
      // Convert BigInt to string before caching
      const cacheData = convertBigIntToString({
        name: collectionName,
        symbol: collectionSymbol,
        description: collectionDescription,
        logo: collectionLogo,
        supplyCap: collectionSupplyCap,
        standards: supportedStandards,
        customMetadata: customMetadata,
        totalCount: totalCount,
      });
      cacheUtils.set(COLLECTION_CACHE_KEY, cacheData);
      console.log('FORCED WRITE TO CACHE:', cacheUtils.get(COLLECTION_CACHE_KEY));
      console.log('RAW LOCALSTORAGE:', localStorage.getItem('nft_cache_v1_collection_metadata'));
    }
  }, [collectionName, collectionSymbol, collectionDescription, collectionLogo, collectionSupplyCap, supportedStandards, customMetadata, totalCount]);

  // Fetch NFTs for a page and append
  const fetchNFTs = useCallback(async (page, pageSize, useCache = true) => {
    const CACHE_KEY = `nfts_page_${page}_size_${pageSize}`;
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
          // Try NFT-level cache
          const nftCacheKey = `nft_${tokenId}`;
          const cachedNft = cacheUtils.get(nftCacheKey);
          if (cachedNft) return cachedNft;
          // Process NFT data
          let metadataUrl = null;
          if (meta) {
            for (const [key, value] of meta) {
              if (key === "icrc97:metadata" && value.Array) {
                const urlValue = value.Array[0];
                if (urlValue && urlValue.Text) {
                  metadataUrl = urlValue.Text;
                  break;
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
            };
            cacheUtils.set(nftCacheKey, fallback);
            return fallback;
          }
          try {
            // Check cache for metadata
            const metadataCacheKey = `nft_metadata_${tokenId}`;
            let jsonMetadata = cacheUtils.get(metadataCacheKey);
            if (!jsonMetadata) {
              const response = await fetch(metadataUrl);
              jsonMetadata = await response.json();
              cacheUtils.set(metadataCacheKey, jsonMetadata);
            }
            // Cache the image if available
            if (jsonMetadata.image) {
              try {
                await imageCache.cacheImage(jsonMetadata.image);
              } catch (error) {
                // Ignore image cache errors
              }
            }
            const nftData = {
              id: tokenId,
              name: jsonMetadata.name || `NFT #${tokenId}`,
              description: jsonMetadata.description || "",
              image: jsonMetadata.image || "",
              attributes: jsonMetadata.attributes || [],
              metadataUrl
            };
            cacheUtils.set(nftCacheKey, nftData);
            return nftData;
          } catch (fetchError) {
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
      );
      const validNfts = parsed.filter(Boolean);
      setNfts(prev => {
        // Avoid duplicates
        const ids = new Set(prev.map(n => n.id));
        return [...prev, ...validNfts.filter(n => !ids.has(n.id))];
      });
      cacheUtils.set(CACHE_KEY, validNfts);
      // Preload images for this page using Cache API
      validNfts.forEach(async nft => {
        if (nft.image) {
          try {
            await imageCache.cacheImage(nft.image);
          } catch {}
        }
      });
      if (validNfts.length < pageSize) setHasMore(false);
    } catch (e) {
      setHasMore(false);
    }
    setLoading(false);
    setLoadingMore(false);
  }, []);

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

  // On manual refresh, clear cache and state, then refetch
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    cacheUtils.clear(COLLECTION_CACHE_KEY);
    await imageCache.clearCache();
    localStorage.setItem('nft_cache_last_updated', Date.now().toString());
    setCollectionName("");
    setCollectionSymbol("");
    setCollectionDescription("");
    setCollectionLogo("");
    setCollectionSupplyCap(null);
    setSupportedStandards([]);
    setCustomMetadata([]);
    setCollectionLoading(true);
    setNfts([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    await fetchNFTs(1, pageSize, false);
    setRefreshing(false);
  }, [fetchNFTs, pageSize]);

  const handleNftClick = (nft) => {
    setSelectedNft(nft);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedNft(null);
  };

  // Helper for null display with field name
  const nullText = (field) => <span className="text-muted text-sm">{field}: null</span>;

  // Helper for custom metadata icons
  function renderCustomMetadata() {
    if (!customMetadata || customMetadata.length === 0) {
      return (
        <div className="flex flex-col items-start mt-2">{nullText('Custom Metadata')}</div>
      );
    }
    const icons = {
      website: <FaGlobe className="inline mr-xs" />, web: <FaGlobe className="inline mr-xs" />,
      twitter: <FaTwitter className="inline mr-xs" />, discord: <FaDiscord className="inline mr-xs" />
    };
    let found = false;
    return (
      <div className="flex gap-lg flex-wrap items-center mt-2">
        {customMetadata.map(([key, value], idx) => {
          if (value.Text && (key.toLowerCase().includes('website') || key.toLowerCase().includes('web') || key.toLowerCase().includes('twitter') || key.toLowerCase().includes('discord'))) {
            found = true;
            let icon = icons[key.toLowerCase()] || <FaGlobe className="inline mr-xs" />;
            return (
              <a key={idx} href={value.Text} target="_blank" rel="noopener noreferrer" className="flex items-center gap-xs text-accent underline text-sm font-semibold hover:text-accent-dark transition-colors">
                {icon}{key}
              </a>
            );
          }
          return null;
        })}
        {!found && <div className="flex flex-col items-start">{nullText('Custom Metadata')}</div>}
      </div>
    );
  }

  // Helper for truncated description
  function renderDescription() {
    const desc = collectionDescription || '';
    if (!desc) return nullText('Description');
    if (desc.length <= 120) return desc;
    if (descExpanded) return <>{desc} <button className="text-accent underline text-xs ml-1" onClick={() => setDescExpanded(false)}>less</button></>;
    return <>{desc.slice(0, 120)}... <button className="text-accent underline text-xs ml-1" onClick={() => setDescExpanded(true)}>more</button></>;
  }

  // Debug: Log what is being passed to CollectionBanner
  useEffect(() => {
    console.log('CollectionBanner props:', {
      collectionLogo,
      collectionName,
      collectionSymbol,
      collectionDescription,
      customMetadata,
      totalCount,
      collectionSupplyCap,
      supportedStandards,
      refreshing,
      collectionLoading
    });
  }, [collectionLogo, collectionName, collectionSymbol, collectionDescription, customMetadata, totalCount, collectionSupplyCap, supportedStandards, refreshing, collectionLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181c24] to-[#23283a]">
      <CollectionBanner
        collectionLogo={collectionLogo}
        collectionName={collectionName}
        collectionSymbol={collectionSymbol}
        collectionDescription={collectionDescription}
        customMetadata={customMetadata}
        totalCount={totalCount}
        collectionSupplyCap={collectionSupplyCap}
        supportedStandards={supportedStandards}
        refreshing={refreshing}
        handleRefresh={handleRefresh}
        collectionLoading={collectionLoading}
      />
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
      />
    </div>
  );
}

export default App;
