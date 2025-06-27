// utils/imageCache.js
const CACHE_NAME = 'nft-images-v1';

export const imageCache = {
  // Cache an image
  cacheImage: async (url) => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await fetch(url, { mode: 'cors' });
      await cache.put(url, response.clone());
      return response;
    } catch (error) {
      console.error('Image caching failed:', error);
      return fetch(url); // Fallback to regular fetch
    }
  },

  // Get cached image
  getCachedImage: async (url) => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(url);
      return cachedResponse || null;
    } catch (error) {
      console.error('Image cache access failed:', error);
      return null;
    }
  },

  // Clear image cache
  clearCache: async () => {
    try {
      await caches.delete(CACHE_NAME);
    } catch (error) {
      console.error('Image cache clear failed:', error);
    }
  }
}; 