import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment as EnvironmentDrei, Loader } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Experience } from "./components/Experience";

// --- Top Bar (Sticky, Visible on Desktop & Mobile) ---
const TopBar = () => (
  <div className="fixed top-0 left-0 w-full z-[100] pointer-events-auto">
    {/* Glass Background - High Contrast */}
    <div className="absolute inset-0 bg-gradient-to-r from-[#0b1124]/90 via-[#0f172a]/85 to-[#111827]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_12px_60px_rgba(11,17,36,0.9)]" />

    {/* Content */}
    <div className="relative flex items-center justify-between px-6 h-16 gap-3 max-w-7xl mx-auto">
      {/* Left: Hamburger & Logo */}
      <div className="flex items-center gap-6">
        <button className="text-white active:scale-95 transition-transform p-1 hover:text-purple-400">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <span className="text-white font-bold text-xl tracking-wider font-mono">
          ONES4
        </span>
      </div>

      {/* Center: Search Bar (Responsive) */}
      <div className="flex-1 max-w-[400px] h-10 relative group hidden sm:block mx-4">
        <div className="absolute inset-0 bg-white/5 rounded-full border border-white/15 group-focus-within:border-purple-400/60 group-focus-within:bg-white/10 transition-all duration-300 shadow-[0_0_25px_rgba(120,90,255,0.35)]" />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
          {/* Search Icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <input
          id="topbar-search"
          name="search"
          type="text"
          placeholder="Search database..."
          className="w-full h-full bg-transparent border-none outline-none text-white text-xs font-mono pl-10 pr-10 placeholder-white/30 tracking-wide"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer transition-colors">
          {/* Mic Icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </div>
      </div>

      {/* Right: Icons */}
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2 text-white/60 hover:text-white cursor-pointer transition-colors">
          <span className="text-xs font-mono tracking-widest">ACCOUNT</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>

        <button className="text-white/80 hover:text-white transition-colors relative p-1 group">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:stroke-purple-400 transition-colors"
          >
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#050505] shadow-[0_0_10px_rgba(168,85,247,0.8)]">
            2
          </div>
        </button>
      </div>
    </div>
  </div>
);

// --- Mobile Bottom Nav (Visible on Mobile Only) ---
type MobileNavItemProps = {
  label: string;
  iconSrc: string;
  isActive?: boolean;
};

const MobileNavItem = ({ iconSrc, label, isActive }: MobileNavItemProps) => (
  <div
    className={`flex flex-col items-center gap-1.5 transition-all cursor-pointer group ${
      isActive ? "opacity-100 scale-105" : "opacity-60 hover:opacity-85"
    }`}
  >
    <span
      className={`
        w-14 h-14 rounded-2xl overflow-hidden
        flex items-center justify-center
        bg-gradient-to-br from-[#0ea5e9]/30 to-[#a855f7]/30
        border border-white/15
        backdrop-blur-md
        shadow-[0_10px_30px_rgba(0,0,0,0.45)]
        group-active:scale-95 transition-transform
        ${isActive ? "border-purple-400/50 shadow-[0_0_18px_rgba(168,85,247,0.35)]" : ""}
      `}
    >
      <img
        src={iconSrc}
        alt={label}
        className="w-full h-full object-cover brightness-110 contrast-110"
        loading="lazy"
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = "none";
        }}
      />
    </span>
    <span
      className={`text-[9px] font-bold tracking-[0.2em] ${
        isActive ? "text-purple-200" : "text-white"
      }`}
    >
      {label}
    </span>
    {isActive && (
      <div className="w-1 h-1 bg-purple-500 rounded-full mt-1 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
    )}
  </div>
);

// Bottom nav icons: place your assets in public/icons/ (or adjust the URLs).
const BOTTOM_NAV_ITEMS: MobileNavItemProps[] = [
  { label: "OUTERWEAR", iconSrc: "/icons/outerwear.png" },
  { label: "TOPS", iconSrc: "/icons/tops.png" },
  { label: "BOTTOMS", iconSrc: "/icons/bottoms.png" },
  { label: "BAGS", iconSrc: "/icons/footwear.png" },
  { label: "ACCESSORIES", iconSrc: "/icons/accessories.png" },
];

const MobileNavbar = () => (
  <div className="fixed bottom-0 left-0 w-full z-[9999] pointer-events-auto animate-slide-up">
    {/* Mirror Spirit Halo Effect */}
    <div className="absolute -top-12 left-0 w-full h-12 bg-gradient-to-t from-purple-500/20 to-transparent blur-xl pointer-events-none" />
    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-400/50 to-transparent shadow-[0_0_20px_rgba(168,85,247,0.6)]" />

    {/* Scroll Hint (Floating Above) */}
    <div className="absolute -top-24 left-0 w-full h-16 flex items-end justify-center pb-4 pointer-events-none">
      <div className="flex flex-col items-center gap-2 animate-scroll-hint">
        <div className="w-12 h-[2px] bg-white/30 rounded-full backdrop-blur-sm" />
        <div className="w-1 h-1 bg-white/20 rounded-full" />
      </div>
    </div>

    {/* Main Bar Background */}
    <div className="absolute inset-0 bg-gradient-to-t from-[#0b1124]/92 via-[#0f172a]/88 to-[#111827]/82 backdrop-blur-2xl border-t border-white/8 shadow-[0_-20px_60px_rgba(11,17,36,0.85)]" />

        <div className="relative flex justify-between items-center px-6 py-4 pb-8 safe-area-bottom">
      {BOTTOM_NAV_ITEMS.map((item, idx) => (
        <MobileNavItem
          key={item.label}
          iconSrc={item.iconSrc}
          label={item.label}
          isActive={idx === 0}
        />
      ))}
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <>
      <div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none">
        {/* Optional 2D Overlay for specific non-VR fallbacks or crosshairs */}
        <div className="hidden md:flex items-center justify-center w-full h-full">
          {/* Center crosshair for desktop 'gaze' simulation */}
          <div className="w-1.5 h-1.5 bg-white/20 rounded-full mix-blend-difference" />
        </div>

        {/* Scroll Instruction - Desktop */}
        <div className="absolute bottom-10 left-0 w-full text-center hidden md:block">
          <div className="text-white/30 text-xs font-light tracking-[0.3em] uppercase mb-2 animate-pulse">
            Scroll to Explore
          </div>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/20 to-transparent mx-auto" />
        </div>
      </div>

      <TopBar />
      <MobileNavbar />

      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#0b1124"]} />

        <Suspense fallback={null}>
          <Experience />

          <EnvironmentDrei preset="city" environmentIntensity={0.2} />

          <EffectComposer disableNormalPass>
            <Bloom
              luminanceThreshold={1}
              mipmapBlur
              intensity={1.5}
              radius={0.4}
            />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      <Loader
        containerStyles={{ background: "#0b1124" }}
        barStyles={{ background: "#fff", height: "2px" }}
        dataStyles={{ fontFamily: "monospace", color: "#8ea0c8" }}
      />
    </>
  );
};

export default App;
