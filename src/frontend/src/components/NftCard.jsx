import React from "react";

function NftCard({ nft, onClick, imageLoaded, imageLoading }) {
  return (
    <div className="nft-card" onClick={() => onClick(nft)}>
      <div className="relative aspect-square overflow-hidden">
        {nft.image ? (
          <>
            <img
              src={nft.image}
              alt={nft.name}
              className={`nft-card-image ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{ transition: 'opacity 0.3s ease' }}
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
      <div className="p-md">
        <h3 className="text-lg font-semibold text-primary truncate">
          {nft.name}
        </h3>
      </div>
    </div>
  );
}

export default NftCard; 