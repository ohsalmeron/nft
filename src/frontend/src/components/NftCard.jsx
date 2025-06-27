import React from "react";

function NftCard({ nft, onClick, imageLoaded, imageLoading }) {
  return (
    <div className="nft-card" onClick={() => onClick(nft)}>
      <div className="relative w-full" style={{ aspectRatio: '1 / 1', overflow: 'hidden' }}>
        {nft.image ? (
          <>
            <img
              src={nft.image}
              alt={nft.name}
              className={`nft-card-image w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{ transition: 'opacity 0.3s ease', width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
            />
            {imageLoading && !imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
                <div className="loading-spinner w-8 h-8"></div>
              </div>
            )}
            {!imageLoading && !imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-muted text-sm">Loading...</div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted bg-gradient-to-br from-gray-100 to-gray-200">
            No Image
          </div>
        )}
        <div className="glass-badge absolute top-sm right-sm">
          #{nft.id}
        </div>
      </div>
      <div className="p-md w-full" style={{ maxWidth: '100%' }}>
        <h3 className="text-xs font-medium text-primary nft-card-title" style={{ 
          fontSize: 'clamp(0.65rem, 0.8vw, 0.85rem)', 
          lineHeight: '1.2', 
          wordWrap: 'break-word', 
          overflowWrap: 'break-word'
        }}>
          {nft.name}
        </h3>
      </div>
    </div>
  );
}

export default NftCard; 