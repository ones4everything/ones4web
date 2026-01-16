// Shopify Storefront API Configuration
// Get these from your Shopify Partner Dashboard or Store Settings -> Apps -> Headless

export const SHOPIFY_CONFIG = {
  // Your store domain (e.g., 'your-brand.myshopify.com')
  domain: process.env.REACT_APP_SHOPIFY_DOMAIN || 'mock-store.myshopify.com',
  
  // Your Storefront Access Token (Public)
  storefrontAccessToken: process.env.REACT_APP_SHOPIFY_TOKEN || '',
  
  // API Version
  apiVersion: '2024-01',
};

// Feature flag: Set to true only if credentials are valid
export const IS_SHOPIFY_LIVE = 
  SHOPIFY_CONFIG.domain !== 'mock-store.myshopify.com' && 
  SHOPIFY_CONFIG.storefrontAccessToken !== '';
