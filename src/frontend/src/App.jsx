import { useEffect, useState } from "react";
import { createActor } from "../../core_nft/api/declarations";

const MAINNET_CANISTER_ID = "xea2t-daaaa-aaaaj-qnp2a-cai";

function App() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNft, setSelectedNft] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function fetchNFTs() {
      setLoading(true);
      try {
        // Always use mainnet canister and boundary node
        const mainnetActor = createActor(MAINNET_CANISTER_ID, {
          agentOptions: {
            host: "https://icp0.io",
          },
        });

        // Get all token IDs
        const tokenIds = await mainnetActor.icrc7_tokens([], []);
        // Fetch metadata for each token
        const metadatas = await mainnetActor.icrc7_token_metadata(tokenIds);
        
        // Parse metadata and fetch JSON
        const parsed = await Promise.all(
          tokenIds.map(async (id, idx) => {
            // Convert BigInt to string for display
            const tokenId = typeof id === 'bigint' ? id.toString() : id;
            
            const meta = metadatas[idx]?.[0];
            if (!meta) return null;
            
            // Find the metadata URL in the nested structure
            let metadataUrl = null;
            for (const [key, value] of meta) {
              if (key === "icrc97:metadata" && value.Array) {
                // Extract URL from the array structure
                const urlValue = value.Array[0];
                if (urlValue && urlValue.Text) {
                  metadataUrl = urlValue.Text;
                  break;
                }
              }
            }
            
            if (!metadataUrl) return { id: tokenId, name: `NFT #${tokenId}`, description: "No metadata available" };
            
            try {
              // Fetch the JSON metadata
              const response = await fetch(metadataUrl);
              const jsonMetadata = await response.json();
              
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
              return { id: tokenId, name: `NFT #${tokenId}`, description: "Failed to load metadata" };
            }
          })
        );
        
        setNfts(parsed.filter(Boolean));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    fetchNFTs();
  }, []);

  const handleNftClick = (nft) => {
    setSelectedNft(nft);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedNft(null);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem 0',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold' }}>NFT Collection Gallery</h1>
        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Explore the complete collection</p>
      </header>

      <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{
              display: 'inline-block',
              width: '50px',
              height: '50px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ marginTop: '1rem', color: '#666' }}>Loading NFT collection...</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
            padding: '1rem 0'
          }}>
            {nfts.map((nft) => (
              <div
                key={nft.id}
                onClick={() => handleNftClick(nft)}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  border: '1px solid #e9ecef'
                }}
              >
                <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
                  {nft.image ? (
                    <img
                      src={nft.image}
                      alt={nft.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(45deg, #f0f0f0, #e0e0e0)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999'
                    }}>
                      No Image
                    </div>
                  )}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    #{nft.id}
                  </div>
                </div>
                <div style={{ padding: '1rem' }}>
                  <h3 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#333',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {nft.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && selectedNft && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }} onClick={closeModal}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                fontSize: '1.2rem',
                zIndex: 10
              }}
            >
              ×
            </button>

            {/* NFT Image */}
            <div style={{ position: 'relative' }}>
              {selectedNft.image ? (
                <img
                  src={selectedNft.image}
                  alt={selectedNft.name}
                  style={{
                    width: '100%',
                    height: '400px',
                    objectFit: 'cover',
                    borderTopLeftRadius: '16px',
                    borderTopRightRadius: '16px'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '400px',
                  background: 'linear-gradient(45deg, #f0f0f0, #e0e0e0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px'
                }}>
                  No Image Available
                </div>
              )}
              <div style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                #{selectedNft.id}
              </div>
            </div>

            {/* NFT Details */}
            <div style={{ padding: '2rem' }}>
              <h2 style={{
                margin: '0 0 1rem 0',
                fontSize: '1.8rem',
                fontWeight: 'bold',
                color: '#333'
              }}>
                {selectedNft.name}
              </h2>
              
              <p style={{
                margin: '0 0 1.5rem 0',
                fontSize: '1rem',
                lineHeight: '1.6',
                color: '#666'
              }}>
                {selectedNft.description}
              </p>

              {selectedNft.attributes && selectedNft.attributes.length > 0 && (
                <div>
                  <h3 style={{
                    margin: '0 0 1rem 0',
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    Traits
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '0.75rem'
                  }}>
                    {selectedNft.attributes.map((attr, idx) => (
                      <div key={idx} style={{
                        background: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#666',
                          marginBottom: '0.25rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {attr.trait_type}
                        </div>
                        <div style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#333'
                        }}>
                          {attr.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;
