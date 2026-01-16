import { SHOPIFY_CONFIG } from '../config';
import { storefrontClient } from './storefrontClient';

// --- QUERIES ---

export const PRODUCTS_QUERY = `
  query getProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          description
          handle
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  query productByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      description
      handle
      images(first: 6) {
        edges {
          node {
            url
            altText
          }
        }
      }
      variants(first: 1) {
        edges {
          node {
            id
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

export const CHECKOUT_MUTATION = `
  mutation checkoutCreate($lineItems: [CheckoutLineItemInput!]!) {
    checkoutCreate(input: {lineItems: $lineItems}) {
      checkout {
        id
        webUrl
      }
      checkoutUserErrors {
        code
        field
        message
      }
    }
  }
`;

// --- FETCHER ---

function buildEndpoint() {
  const domain = (SHOPIFY_CONFIG.domain || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
  if (!domain || !SHOPIFY_CONFIG.storefrontAccessToken) {
    throw new Error('Missing Shopify configuration (domain or token)');
  }

  return `https://${domain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`;
}

export async function shopifyFetch(query: string, variables: Record<string, any> = {}) {
  if (!SHOPIFY_CONFIG.domain) {
    throw new Error('Missing Shopify configuration');
  }

  try {
    if (storefrontClient && SHOPIFY_CONFIG.storefrontAccessToken) {
      const { data, errors, status } = await storefrontClient.request({
        method: 'POST',
        headers: {},
        query,
        variables,
      });

      if (errors && errors.length) {
        console.error('Shopify API errors:', {
          status,
          errors,
          domain: SHOPIFY_CONFIG.domain,
          tokenLength: SHOPIFY_CONFIG.storefrontAccessToken?.length || 0,
        });
        throw new Error(errors[0]?.message || 'Shopify API error');
      }

      return data;
    }

    // Tokenless fallback
    const endpoint = buildEndpoint();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(SHOPIFY_CONFIG.storefrontAccessToken
          ? { 'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken }
          : {}),
      },
      body: JSON.stringify({ query, variables }),
    });

    const json = await response.json();

    if (!response.ok || json.errors) {
      console.error('Shopify API HTTP error:', {
        status: response.status,
        statusText: response.statusText,
        errors: json?.errors,
        endpoint,
        domain: SHOPIFY_CONFIG.domain,
        tokenLength: SHOPIFY_CONFIG.storefrontAccessToken?.length || 0,
        tokenless: !SHOPIFY_CONFIG.storefrontAccessToken,
      });
      throw new Error(json?.errors?.[0]?.message || `Shopify API error (${response.status})`);
    }

    return json.data;
  } catch (err: any) {
    console.error('Shopify fetch error:', {
      err,
      domain: SHOPIFY_CONFIG.domain,
      tokenLength: SHOPIFY_CONFIG.storefrontAccessToken?.length || 0,
      tokenless: !SHOPIFY_CONFIG.storefrontAccessToken,
    });
    throw err;
  }
}

// --- HELPERS ---

export interface ShopifyProduct {
  id: string;
  label: string;
  price: string;
  priceVal: number;
  imageUrl: string;
  variantId: string;
  handle?: string;
  description?: string;
  images?: string[];
  currencyCode?: string;
}

export function formatShopifyProduct(node: any): ShopifyProduct {
  const price = node.variants?.edges?.[0]?.node?.price?.amount || '0';
  const currency = node.variants?.edges?.[0]?.node?.price?.currencyCode || 'USD';
  const images = node.images?.edges?.map((edge: any) => edge?.node?.url).filter(Boolean) || [];
  const image = images[0] || '';
  const variantId = node.variants?.edges?.[0]?.node?.id;

  return {
    id: node.id,
    label: node.title.toUpperCase(),
    price: `$${parseFloat(price).toLocaleString()}`, // Simplified formatting
    priceVal: parseFloat(price),
    imageUrl: image,
    variantId: variantId,
    handle: node.handle,
    description: node.description,
    images,
    currencyCode: currency
  };
}
