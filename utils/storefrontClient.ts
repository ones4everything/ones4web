import { createStorefrontApiClient } from "@shopify/storefront-api-client";
import { SHOPIFY_CONFIG } from "../config";

const hasToken = !!SHOPIFY_CONFIG.storefrontAccessToken;
const hasDomain = !!SHOPIFY_CONFIG.domain;
const isConfigured = hasDomain && hasToken;

export const storefrontClient = createStorefrontApiClient({
  storeDomain: SHOPIFY_CONFIG.domain,
  apiVersion: SHOPIFY_CONFIG.apiVersion,
  publicAccessToken: hasToken ? SHOPIFY_CONFIG.storefrontAccessToken : undefined,
});

export async function storefrontRequest<T>(
  query: string,
  variables: Record<string, any> = {}
): Promise<T> {
  // Short-circuit when Shopify isn’t configured to avoid noisy console spam.
  if (!isConfigured) {
    console.warn("[Shopify] Skipping storefront request: missing domain or token.");
    // Return an empty object casted to T so callers can handle an empty payload gracefully.
    return {} as T;
  }

  try {
    const { data, errors, status } = await storefrontClient.request<T>(query, { variables });
    if (errors && errors.length) {
      console.error("Shopify Storefront error", {
        status,
        errors,
        domain: SHOPIFY_CONFIG.domain,
        tokenLength: SHOPIFY_CONFIG.storefrontAccessToken?.length || 0,
        mode: hasToken ? "authenticated" : "tokenless",
      });
      throw new Error(JSON.stringify(errors, null, 2));
    }
    return data as T;
  } catch (err: any) {
    console.error("Shopify Storefront request failed", {
      err,
      domain: SHOPIFY_CONFIG.domain,
      tokenLength: SHOPIFY_CONFIG.storefrontAccessToken?.length || 0,
      mode: hasToken ? "authenticated" : "tokenless",
    });
    throw err;
  }
}
