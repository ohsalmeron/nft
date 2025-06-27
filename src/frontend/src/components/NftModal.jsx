import React from "react";

function NftModal({ nft, show, onClose, imageLoaded }) {
  if (!show || !nft) return null;

  return (
    <div className="nft-modal-backdrop" onClick={onClose}>
      <div
        className="nft-modal p-0 flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '100vh' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="glass-button absolute top-sm right-sm w-9 h-9 text-xl z-10"
          aria-label="Close Modal"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          &times;
        </button>

        {/* NFT Image - Large, Edge-to-Edge, Square */}
        <div
          style={{
            width: '100%',
            aspectRatio: '1',
            minHeight: 0,
            maxHeight: '60vh',
            overflow: 'hidden',
            background: 'var(--glass-primary)',
            borderRadius: 0,
            position: 'relative',
            flexShrink: 0,
          }}
        >
          {nft.image ? (
            <>
              <img
                src={nft.image}
                alt={nft.name}
                className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{ transition: 'opacity 0.3s ease', borderRadius: 0, width: '100%', height: '100%', display: 'block' }}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
                  <div className="loading-spinner w-12 h-12"></div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-base text-muted">
              No Image Available
            </div>
          )}
        </div>

        {/* NFT Information - Gallery Style */}
        <div
          className="nft-modal-info text-center w-full max-w-md mx-auto p-lg"
          style={{
            background: 'var(--glass-bg)',
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            marginTop: '0',
            borderRadius: 0,
            boxShadow: 'none',
          }}
        >
          <h2 className="text-xl font-bold mb-sm text-primary">{nft.name}</h2>
          <p className="text-sm text-secondary text-center mb-lg min-h-10 leading-relaxed">
            {nft.description || "No description provided."}
          </p>

          {/* Traits - Professional Display */}
          {nft.attributes && nft.attributes.length > 0 && (
            <div className="mb-lg">
              <h3 className="text-base font-semibold mb-md uppercase letter-spacing text-accent">
                Traits
              </h3>
              <div className="flex flex-wrap gap-sm justify-center max-w-full">
                {nft.attributes.map((attr, idx) => (
                  <div key={idx} className="nft-trait">
                    <div className="text-xs font-semibold uppercase letter-spacing text-accent mb-xs">
                      {attr.trait_type}
                    </div>
                    <div className="font-semibold text-primary">{attr.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* NFT ID Badge - Gallery Style */}
        <div className="glass-badge absolute left-md bottom-md">
          #{nft.id}
        </div>
      </div>
    </div>
  );
}

export default NftModal;
