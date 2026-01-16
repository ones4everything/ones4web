import { SHOPIFY_CONFIG } from '../config';

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

export async function shopifyFetch(query: string, variables = {}) {
  const endpoint = `https://${SHOPIFY_CONFIG.domain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`;

  try {
    const result = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    const body = await result.json();

    if (body.errors) {
      console.error("Shopify API Errors:", body.errors);
      throw body.errors[0];
    }

    return body.data;
  } catch (error) {
    console.error("Failed to fetch from Shopify:", error);
    throw error;
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
}

export function formatShopifyProduct(node: any): ShopifyProduct {
  const price = node.variants.edges[0]?.node.price.amount || '0';
  const currency = node.variants.edges[0]?.node.price.currencyCode || 'USD';
  const image = node.images.edges[0]?.node.url || '';
  const variantId = node.variants.edges[0]?.node.id;

  return {
    id: node.id,
    label: node.title.toUpperCase(),
    price: `$${parseFloat(price).toLocaleString()}`, // Simplified formatting
    priceVal: parseFloat(price),
    imageUrl: image,
    variantId: variantId
  };
}
