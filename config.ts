// Shopify Storefront API configuration.
// Vite injects VITE_* keys from your .env.[mode] files.
const SHOPIFY_DOMAIN = (import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || '').trim();
const SHOPIFY_TOKEN = (import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN || '').trim();
const SHOPIFY_API_VERSION = (import.meta.env.VITE_SHOPIFY_API_VERSION || '').trim() || '2024-10';

export const SHOPIFY_CONFIG = {
  domain: SHOPIFY_DOMAIN,
  storefrontAccessToken: SHOPIFY_TOKEN,
  apiVersion: SHOPIFY_API_VERSION,
};
export const HAS_SHOPIFY_CONFIG = Boolean(SHOPIFY_DOMAIN && SHOPIFY_TOKEN);

// Debug logging
console.log('[Shopify] Config:', {
  domain: SHOPIFY_CONFIG.domain,
  hasToken: !!SHOPIFY_CONFIG.storefrontAccessToken,
  tokenLength: SHOPIFY_CONFIG.storefrontAccessToken?.length || 0,
  apiVersion: SHOPIFY_CONFIG.apiVersion,
  mode: SHOPIFY_CONFIG.storefrontAccessToken ? 'authenticated' : 'tokenless',
});

export const USE_LIVE_DATA = SHOPIFY_CONFIG.domain !== '';
export const IS_SHOPIFY_LIVE = USE_LIVE_DATA;
