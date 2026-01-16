import React, { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ScrollControls, Scroll, useScroll } from "@react-three/drei";
import { MathUtils, Group } from "three";
import { CurvedMenu } from "./Menu/CurvedMenu";
import { StarField } from "./World/StarField";
import { SectionMarkers } from "./World/SectionMarkers";
import { WinterSection, TechSection, HorizonSection, IntroHint } from "./World/SpatialContent";
import { storefrontRequest } from "../utils/storefrontClient";
import { HAS_SHOPIFY_CONFIG, SHOPIFY_CONFIG } from "../config";

/**
 * -----------------------------
 * Shopify Storefront (Client-side)
 * -----------------------------
 * Uses public Storefront access token via:
 *  -H 'X-Shopify-Storefront-Access-Token: ...'
 */
const STORE_DOMAIN = SHOPIFY_CONFIG.domain;

type ShopifyProduct = {
  id: string;
  title: string;
  handle: string;
  imageUrl?: string;
  price?: string;
};

type ShopifyCollectionData = {
  products: ShopifyProduct[];
  imageUrl?: string;
};

type Panel = {
  key: string;
  title: string;
  collectionHandle: string; // Shopify collection handle
};

const PREFERRED_HANDLES = [
  "frontpage",
  "new-arrivals",
  "outerwear",
  "tops",
  "bottoms",
  "bags",
  "accessories",
  "archive",
];

const MIN_PRODUCTS = 2;

function buildDisplayProducts(collectionData?: ShopifyCollectionData) {
  const primary = collectionData?.products || [];

  // If we have live products, never mix in samples—just duplicate live items to reach the minimum.
  if (primary.length > 0) {
    const expanded = [...primary];
    while (expanded.length < MIN_PRODUCTS) {
      const source = primary[expanded.length % primary.length];
      expanded.push({ ...source, id: `${source.id}-dup-${expanded.length}` });
    }
    return expanded.slice(0, 6);
  }

  return [];
}

async function storefrontQuery<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const data = await storefrontRequest<T>(query, variables || {});
  return data;
}

type CollectionsPayload = {
  panels: Panel[];
  collections: Record<string, ShopifyCollectionData>;
  missingHandles: string[];
};

async function getCollectionsWithProducts(
  collectionsFirst = 50,
  productsFirst = 12
): Promise<CollectionsPayload> {
  if (!HAS_SHOPIFY_CONFIG || !STORE_DOMAIN) {
    return { panels: [], collections: {}, missingHandles: [...PREFERRED_HANDLES] };
  }

  const query = `
    query CollectionsWithProducts($first: Int!, $productsFirst: Int!) {
      collections(first: $first) {
        edges {
          node {
            id
            title
            handle
            image { url }
            products(first: $productsFirst) {
              edges {
                node {
                  id
                  title
                  handle
                  featuredImage {
                    url
                    altText
                  }
                  priceRange {
                    minVariantPrice {
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
    }
  `;

  type Resp = {
    collections: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          handle: string;
          image: null | { url: string };
          products: {
            edges: Array<{
              node: {
                id: string;
                title: string;
                handle: string;
                featuredImage: null | { url: string };
                priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
              };
            }>;
          };
        };
      }>;
    };
  };

  const data = await storefrontQuery<Resp>(query, { first: collectionsFirst, productsFirst });
  const collections = data.collections?.edges ?? [];

  const rawPanels: Panel[] = [];
  const collectionsMap: Record<string, ShopifyCollectionData> = {};

  for (const { node } of collections) {
    if (!node?.handle) continue;
    if (node.handle === "footwear") continue;

    const products = node.products.edges.map(({ node: product }) => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      imageUrl: product.featuredImage?.url,
      price: `${product.priceRange.minVariantPrice.amount} ${product.priceRange.minVariantPrice.currencyCode}`,
    }));

    rawPanels.push({
      key: node.id || node.handle,
      title: node.title,
      collectionHandle: node.handle,
    });

    collectionsMap[node.handle] = {
      products,
      imageUrl: node.image?.url || products[0]?.imageUrl,
    };
  }

  const panelByHandle = new Map(rawPanels.map((panel) => [panel.collectionHandle, panel]));
  const orderedPanels: Panel[] = [];
  const seen = new Set<string>();

  for (const handle of PREFERRED_HANDLES) {
    const panel = panelByHandle.get(handle);
    if (panel) {
      orderedPanels.push(panel);
      seen.add(handle);
    }
  }

  for (const panel of rawPanels) {
    if (!seen.has(panel.collectionHandle)) {
      orderedPanels.push(panel);
    }
  }

  const missingHandles = PREFERRED_HANDLES.filter((handle) => !panelByHandle.has(handle));
  if (missingHandles.length > 0) {
    missingHandles.forEach((handle) => {
      console.warn(`[Shopify] Missing collection handle: ${handle}`);
    });
  }

  return { panels: orderedPanels, collections: collectionsMap, missingHandles };
}

/**
 * -----------------------------
 * Experience / Scroll Overlay
 * -----------------------------
 */

// Component to handle camera movement based on scroll
const CameraRig = () => {
  const scroll = useScroll();
  const { camera } = useThree();

  useFrame((state, delta) => {
    if (!scroll) return;

    const targetZ = -(scroll.offset * 70);
    camera.position.z = MathUtils.lerp(camera.position.z, 5 + targetZ, delta * 2);

    const targetRotZ = scroll.offset * 0.2;
    camera.rotation.z = MathUtils.lerp(camera.rotation.z, targetRotZ, delta * 2);

    const targetRotX = -state.pointer.y * 0.05;
    const targetRotY = -state.pointer.x * 0.05;

    camera.rotation.x = MathUtils.lerp(camera.rotation.x, targetRotX, delta * 2);
    camera.rotation.y = MathUtils.lerp(camera.rotation.y, targetRotY, delta * 2);
  });

  return null;
};

const Hud = () => {
  const groupRef = useRef<Group>(null);
  const { camera, size } = useThree();
  const isMobile = size.width < 768;

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(camera.position);
    groupRef.current.quaternion.copy(camera.quaternion);
    groupRef.current.translateZ(-1.5);
  });

  return (
    <group ref={groupRef}>
      {!isMobile && (
        <group position={[0, -0.4, 0]} rotation={[-0.1, 0, 0]}>
          <CurvedMenu />
        </group>
      )}
    </group>
  );
};

type CardsOverlayProps = {
  panels: Panel[];
  collections: Record<string, ShopifyCollectionData>;
  error: string | null;
  isLoading: boolean;
  missingHandles: string[];
  isDev: boolean;
};

function CardsOverlay({
  panels,
  collections,
  error,
  isLoading,
  missingHandles,
  isDev,
}: CardsOverlayProps) {
  const scroll = useScroll();
  const total = panels.length;
  const safeTotal = Math.max(total, 1);

  // Crossfade panels (never blank). useScroll().offset is 0..1 across all pages.
  const pos = (scroll?.offset ?? 0) * (safeTotal - 1); // 0..(safeTotal-1)
  const i = Math.min(Math.floor(pos), safeTotal - 1);
  const frac = Math.min(Math.max(pos - i, 0), 1);

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      <div className="relative w-full h-full flex items-start justify-center px-6 pt-24 pb-32 md:pt-28 md:pb-32 pointer-events-none">
        {isDev && missingHandles.length > 0 && (
          <div className="absolute top-4 right-4 max-w-xs rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200/90">
            <div className="font-semibold tracking-wide">Missing Shopify collections</div>
            <div className="mt-1 break-words">{missingHandles.join(", ")}</div>
          </div>
        )}
        {error && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-3xl">
            <div className="rounded-2xl bg-red-500/10 border border-red-400/20 p-4 text-red-200 text-sm">
              {error}
            </div>
          </div>
        )}

        {panels.length === 0 && (
          <div className="w-full max-w-4xl">
            <div className="rounded-3xl border border-white/12 bg-gradient-to-br from-[#0b1124]/80 via-[#102347]/70 to-[#0e172f]/78 backdrop-blur-2xl p-8 text-white shadow-[0_25px_90px_rgba(20,30,64,0.7)]">
              <div className="text-[10px] uppercase tracking-[0.35em] text-cyan-200/70">Collections</div>
              <div className="text-2xl font-semibold tracking-tight mt-3">
                {isLoading ? "Loading collections..." : "No collections found"}
              </div>
              <div className="text-white/70 text-sm mt-2">
                {error
                  ? "Unable to load Shopify collections. Check your Storefront API configuration."
                  : "Publish at least one collection in Shopify to see it here."}
              </div>
            </div>
          </div>
        )}

        {panels.map((p, idx) => {
          const isCurrent = idx === i;
          const isNext = idx === i + 1;
          if (!isCurrent && !isNext) return null;

          const opacity = isCurrent ? 1 - frac : frac;
          const y = (1 - opacity) * 12;

          const collectionData = collections[p.collectionHandle];
          const heroImage =
            collectionData?.imageUrl ||
            collectionData?.products?.[0]?.imageUrl;
          const displayProducts = buildDisplayProducts(collectionData);
          const liveCount = collectionData?.products?.length ?? 0;
          const hasProducts = displayProducts.length > 0;
          const collectionUrl = STORE_DOMAIN
            ? `https://${STORE_DOMAIN}/collections/${p.collectionHandle}`
            : undefined;

          return (
            <div
              key={p.key}
              style={{ opacity, transform: `translateY(${y}px)` }}
              className="absolute w-full max-w-6xl pointer-events-auto"
            >
              <div className="mb-3 text-white/80 font-mono tracking-[0.35em] text-[11px] uppercase">
                {p.title}
              </div>

              <div className="group relative rounded-3xl border border-white/12 bg-gradient-to-br from-[#0b1124]/80 via-[#102347]/70 to-[#0e172f]/78 backdrop-blur-2xl overflow-hidden shadow-[0_25px_90px_rgba(20,30,64,0.7)] transition-all duration-200 ease-out hover:-translate-y-2 hover:shadow-[0_30px_120px_rgba(99,102,241,0.35)] hover:border-white/18 animate-glow-soft">
                <div className="pointer-events-none absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.22),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(45,212,191,0.18),transparent_32%)]" />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-white/8" />
                <div className="grid lg:grid-cols-5 gap-6 p-7 md:p-8">
                  <div className="lg:col-span-2 text-white space-y-4">
                    <div className="text-[10px] uppercase tracking-[0.35em] text-cyan-200/70 drop-shadow-[0_2px_10px_rgba(99,102,241,0.45)]">Collection</div>
                    <div className="text-2xl font-semibold tracking-tight drop-shadow-[0_6px_24px_rgba(99,102,241,0.45)]">{p.title}</div>
                    <div className="text-white/70 text-xs">{p.collectionHandle}</div>
                    <div className="text-white/80 text-sm leading-relaxed">
                      Showing live products for this handle. If empty, ensure products are assigned and published.
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/70">
                      <span>{liveCount > 0 ? `${liveCount} live item${liveCount > 1 ? "s" : ""}` : "Awaiting publish"}</span>
                      {collectionUrl && (
                        <a
                          href={collectionUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-200 hover:text-white transition-colors underline underline-offset-4"
                        >
                          Open category
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-3 space-y-4">
                    {heroImage ? (
                      <div className="relative w-full min-h-64 md:min-h-80 overflow-hidden group/hero rounded-2xl border border-white/10 bg-gradient-to-r from-[#0b1124]/70 via-[#0e172f]/50 to-transparent shadow-[0_10px_60px_rgba(14,165,233,0.28)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:border-white/18 group-hover:shadow-[0_18px_90px_rgba(99,102,241,0.4)]">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.12),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.12),transparent_40%)] pointer-events-none" />
                        <img
                          src={heroImage}
                          alt={p.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/hero:scale-110 group-hover:translate-y-1"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-l from-[#0b1124]/65 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute inset-0 ring-1 ring-white/10 pointer-events-none" />
                        <div className="absolute -inset-10 opacity-0 group-hover/hero:opacity-35 transition-opacity duration-300 ease-out bg-[conic-gradient(from_120deg_at_50%_50%,rgba(168,85,247,0.15),rgba(14,165,233,0.18),transparent_60%)] blur-3xl pointer-events-none" />
                      </div>
                    ) : (
                      <div className="relative w-full min-h-64 md:min-h-80 rounded-2xl border border-dashed border-white/15 bg-gradient-to-r from-[#0b1124]/70 via-[#0e172f]/50 to-transparent shadow-[0_10px_60px_rgba(14,165,233,0.18)] flex items-center justify-between px-6 py-5">
                        <div className="space-y-2 text-white/80 text-sm max-w-md">
                          <div className="text-[10px] uppercase tracking-[0.35em] text-cyan-200/70">Awaiting media</div>
                          <div className="text-base font-semibold text-white">Add a collection image or product media to surface here.</div>
                          <div className="text-white/60 text-xs">Only published assets from your Shopify catalog will appear.</div>
                        </div>
                        <div className="h-14 w-14 rounded-full border border-white/15 bg-white/5 shadow-[0_10px_40px_rgba(99,102,241,0.25)]" />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3" style={{ perspective: "1200px" }}>
                      {hasProducts ? (
                        displayProducts.map((prod) => {
                          const productUrl = STORE_DOMAIN
                            ? `https://${STORE_DOMAIN}/products/${prod.handle}`
                            : undefined;
                          return (
                            <a
                              key={prod.id}
                              href={productUrl}
                              target={productUrl ? "_blank" : undefined}
                              rel={productUrl ? "noreferrer" : undefined}
                              className="group rounded-2xl bg-white/5 border border-cyan-400/10 backdrop-blur-xl p-3 text-white transform-gpu transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-3 hover:scale-[1.04] hover:border-cyan-300/35 hover:shadow-[0_24px_70px_rgba(14,165,233,0.32)] animate-float-card"
                            >
                              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-[#0f1b3d]/70">
                                {prod.imageUrl ? (
                                  <img
                                    src={prod.imageUrl}
                                    alt={prod.title}
                                    className="w-full h-full object-cover transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-107"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
                                    No image
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1124]/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out" />
                              </div>
                              <div className="mt-3 space-y-1">
                                <div className="font-semibold text-sm line-clamp-2 drop-shadow-[0_3px_12px_rgba(99,102,241,0.35)]">{prod.title}</div>
                                {prod.price && <div className="text-white/60 text-xs">{prod.price}</div>}
                              </div>
                            </a>
                          );
                        })
                      ) : (
                        <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 text-white/80 shadow-[0_10px_50px_rgba(14,165,233,0.18)]">
                          <div className="text-sm font-semibold text-white">No products published yet.</div>
                          <div className="text-xs text-white/60 mt-1">
                            Publish items to the "{p.collectionHandle}" collection to populate this menu with live data.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const Experience: React.FC = () => {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [collections, setCollections] = useState<Record<string, ShopifyCollectionData>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [missingHandles, setMissingHandles] = useState<string[]>([]);
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    let cancelled = false;

    if (!HAS_SHOPIFY_CONFIG || !STORE_DOMAIN) {
      setError("Add VITE_SHOPIFY_STORE_DOMAIN and VITE_SHOPIFY_STOREFRONT_TOKEN to load live products.");
      setPanels([]);
      setCollections({});
      setMissingHandles([]);
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        setError(null);
        setIsLoading(true);
        const { panels: nextPanels, collections: nextCollections, missingHandles: missing } =
          await getCollectionsWithProducts(50, 12);
        if (cancelled) return;
        setPanels(nextPanels);
        setCollections(nextCollections);
        setMissingHandles(missing);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load collections");
        setPanels([]);
        setCollections({});
        setMissingHandles([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const pages = Math.max(panels.length, 1);

  return (
    <ScrollControls pages={pages} damping={0.2}>
      <CameraRig />

      <StarField />
      <SectionMarkers />

      <ambientLight intensity={0.2} />
      <pointLight position={[0, 2, 8]} intensity={1.5} color="#e0e0ff" distance={15} />
      <pointLight position={[0, 0, -5]} intensity={2} color="#bfdbfe" distance={20} />
      <pointLight position={[0, 0, -25]} intensity={2} color="#d8b4fe" distance={30} />
      <pointLight position={[0, 0, -45]} intensity={3} color="#ff8800" distance={40} />

      <Hud />

      <group position={[0, 0, 2]}>
        <IntroHint />
      </group>

      <group position={[0, 0, -10]}>
        <WinterSection />
      </group>

      <group position={[0, 0, -35]}>
        <TechSection />
      </group>

      <group position={[0, 0, -60]}>
        <HorizonSection />
      </group>

      <Scroll html>
        <CardsOverlay
          panels={panels}
          collections={collections}
          error={error}
          isLoading={isLoading}
          missingHandles={missingHandles}
          isDev={isDev}
        />
      </Scroll>
    </ScrollControls>
  );
};
