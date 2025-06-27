import React, { useState } from "react";
import { FaSyncAlt, FaGlobe, FaTwitter, FaDiscord } from "react-icons/fa";

const nullText = (field) => <span className="text-muted text-sm">{field}: null</span>;

function CollectionBanner({
  collectionLogo,
  collectionName,
  collectionSymbol,
  collectionDescription,
  customMetadata,
  totalCount,
  collectionSupplyCap,
  supportedStandards,
  refreshing,
  handleRefresh,
  collectionLoading,
}) {
  const [descExpanded, setDescExpanded] = useState(false);

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

  function renderDescription() {
    const desc = collectionDescription || '';
    if (!desc) return nullText('Description');
    if (desc.length <= 120) return desc;
    if (descExpanded) return <>{desc} <button className="text-accent underline text-xs ml-1" onClick={() => setDescExpanded(false)}>less</button></>;
    return <>{desc.slice(0, 120)}... <button className="text-accent underline text-xs ml-1" onClick={() => setDescExpanded(true)}>more</button></>;
  }

  return (
    <header
      className="relative w-full px-4 py-12 md:py-16 mb-xl"
      style={{
        background: "rgba(24,28,36,0.85)",
        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        borderRadius: 0,
        minHeight: 320,
        display: 'grid',
        gridTemplateRows: '1fr 120px',
        gridTemplateColumns: '1fr 1fr',
      }}
    >
      {/* Refresh Button (top right, absolutely positioned) */}
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="bg-glass rounded-full p-3 shadow-lg hover:bg-accent/20 transition-colors text-accent focus:outline-none"
        title="Refresh"
        style={{ position: 'absolute', top: 12, right: 12, zIndex: 100 }}
      >
        <FaSyncAlt className={refreshing ? "animate-spin" : ""} size={22} />
      </button>
      {/* Bottom Left: Logo, Name, Symbol, Description, Custom Metadata */}
      <div className="flex flex-row items-end gap-6" style={{ gridRow: 2, gridColumn: 1, paddingLeft: 24, paddingBottom: 12 }}>
        {/* Large Logo */}
        {collectionLoading ? null : (
          <div className="flex items-center justify-center" style={{ minWidth: 96, minHeight: 96 }}>
            {collectionLogo ? (
              <img
                src={collectionLogo}
                alt="Collection Logo"
                className="rounded-2xl shadow-xl border-2 border-glass bg-white"
                style={{ width: 96, height: 96, objectFit: 'cover' }}
              />
            ) : (
              <span className="rounded-2xl bg-gray-700 flex items-center justify-center shadow-xl border-2 border-glass" style={{ width: 96, height: 96 }}>
                <span className="text-3xl font-bold text-gray-400">?</span>
              </span>
            )}
          </div>
        )}
        {/* Name, Symbol, Description, Custom Metadata */}
        {collectionLoading ? null : (
          <div className="flex flex-col justify-between h-full py-2" style={{ minWidth: 0 }}>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-2xl md:text-3xl font-extrabold text-white" style={{ lineHeight: 1.1 }}>{collectionName || nullText('Name')}</span>
              <span className="ml-4 px-4 py-1 bg-glass rounded text-lg font-semibold text-secondary border border-gray-600 align-baseline" style={{ display: 'inline-block', verticalAlign: 'baseline' }}>
                {collectionSymbol || nullText('Symbol')}
              </span>
            </div>
            <div className="text-secondary text-sm max-w-xs truncate" style={{ maxWidth: 320, marginBottom: 4 }}>
              {renderDescription()}
            </div>
            {renderCustomMetadata()}
          </div>
        )}
      </div>
      {/* Bottom Right: Stats and Standards (only once) */}
      <div className="flex flex-col items-end justify-end gap-2" style={{ gridRow: 2, gridColumn: 2, paddingRight: 24, paddingBottom: 12 }}>
        {!collectionLoading && (
          <div className="flex mb-1" style={{ gap: '6rem' }}>
            <div className="flex flex-col items-end" style={{ minWidth: '100px' }}>
              <span className="text-2xl font-bold text-white">{totalCount !== undefined && totalCount !== null ? totalCount : nullText('Total Supply')}</span>
              <span className="text-xs text-secondary mt-1">Total Supply</span>
            </div>
            <div className="flex flex-col items-end" style={{ minWidth: '100px' }}>
              <span className="text-2xl font-bold text-white">{collectionSupplyCap !== undefined && collectionSupplyCap !== null ? collectionSupplyCap : <span title="Unlimited" style={{fontFamily:'monospace',fontSize:'2rem',verticalAlign:'middle'}}>&#8734;</span>}</span>
              <span className="text-xs text-secondary mt-1">Supply Cap</span>
            </div>
          </div>
        )}
        {!collectionLoading && (
          <div className="flex gap-2 flex-wrap mt-4 justify-end">
            {supportedStandards && supportedStandards.length > 0 ? (
              supportedStandards.map((std, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs font-semibold border border-accent/20" title={std.url}>{std.name}</span>
              ))
            ) : (
              <span className="text-muted text-xs">{nullText('Standards')}</span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default CollectionBanner; 