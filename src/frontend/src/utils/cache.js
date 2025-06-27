// utils/cache.js
const CACHE_VERSION = 'v1';
const CACHE_PREFIX = `nft_cache_${CACHE_VERSION}_`;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const cacheUtils = {
  // Get cached data with expiration check
  get: (key) => {
    try {
      const item = localStorage.getItem(CACHE_PREFIX + key);
      if (!item) return null;
      const { data, timestamp, version } = JSON.parse(item);
      if (Date.now() - timestamp > CACHE_DURATION || version !== CACHE_VERSION) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return data;
    } catch (error) {
      return null;
    }
  },

  // Set data in cache with timestamp
  set: function (key, data) {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
      console.log('cacheUtils.set: WROTE', CACHE_PREFIX + key, item);
    } catch (error) {
      console.error('cacheUtils.set: FAILED', error);
    }
  },

  // Clear specific key
  clear: (key) => {
    try {
      localStorage.removeItem(CACHE_PREFIX + key);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  },

  // Clear oldest items (percentage of total)
  clearOldest: (percentage = 20) => {
    try {
      const keys = Object.keys(localStorage)
        .filter(k => k.startsWith(CACHE_PREFIX))
        .map(key => ({
          key,
          timestamp: JSON.parse(localStorage.getItem(key)).timestamp
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
      const itemsToRemove = Math.ceil(keys.length * (percentage / 100));
      keys.slice(0, itemsToRemove).forEach(item => {
        localStorage.removeItem(item.key);
      });
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  },

  // Clear all cached data
  clearAll: () => {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(CACHE_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Cache clearAll error:', error);
    }
  }
}; 