import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ScrollControls, Scroll, useScroll } from '@react-three/drei';
import { MathUtils, Vector3, Group } from 'three';
import { CurvedMenu } from './Menu/CurvedMenu';
import { StarField } from './World/StarField';
import { SectionMarkers } from './World/SectionMarkers';
import { WinterSection, TechSection, HorizonSection, IntroHint } from './World/SpatialContent';

const CAMERA_SPEED = 20;

// Component to handle camera movement based on scroll
const CameraRig = () => {
    const scroll = useScroll();
    const { camera } = useThree();
    
    useFrame((state, delta) => {
        // Guard against NaN or initial glitches
        if (!scroll) return;

        // Increased depth range from 50 to 70 to accommodate deeper sections
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
}

const Hud = () => {
  const groupRef = useRef<Group>(null);
  const { camera, size } = useThree();
  
  // Simple check for mobile width (e.g. < 768px)
  const isMobile = size.width < 768;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(camera.position);
      groupRef.current.quaternion.copy(camera.quaternion);
      
      // Fixed offset: Forward 1.5m
      groupRef.current.translateZ(-1.5);
    }
  });

  return (
    <group ref={groupRef}>
        {/* 3D Curved Menu - Visible on desktop/tablet */}
        {!isMobile && (
            <group position={[0, -0.4, 0]} rotation={[-0.1, 0, 0]}>
                <CurvedMenu />
            </group>
        )}
    </group>
  );
};
type Panel = {
  key: string;
  title: string;
  center: number;   // scroll.offset center (0..1)
  width: number;    // how wide the fade window is
  cards: { title: string; body?: string }[];
};

const PANELS: Panel[] = [
  {
    key: "intro",
    title: "WELCOME",
    center: 0.07,
    width: 0.18,
    cards: [
      { title: "Drop Ready", body: "Scroll to explore the world." },
      { title: "Fast Checkout", body: "Mobile-first flow." },
      { title: "New Arrivals", body: "Updated weekly." },
    ],
  },
  {
    key: "winter",
    title: "WINTER",
    // Your WinterSection is at z=-10. With camera z ≈ 5 - 70*offset,
    // offset ≈ (5 - (-10))/70 ≈ 0.214
    center: 0.22,
    width: 0.20,
    cards: [
      { title: "Jackets" },
      { title: "Hoodies" },
      { title: "Thermals" },
      { title: "Accessories" },
    ],
  },
  {
    key: "tech",
    title: "TECH",
    // TechSection at z=-35 => offset ≈ 0.571
    center: 0.57,
    width: 0.22,
    cards: [
      { title: "Kicks" },
      { title: "Performance" },
      { title: "New Materials" },
      { title: "Limited" },
      { title: "Bundles" },
      { title: "Featured" },
    ],
  },
  {
    key: "horizon",
    title: "HORIZON",
    // HorizonSection at z=-60 => offset ≈ 0.929
    center: 0.93,
    width: 0.14,
    cards: [
      { title: "The Final Drop" },
      { title: "Members Only" },
      { title: "Season Pass" },
    ],
  },
];

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

// 0..1 opacity that fades in then fades out around a center
function windowOpacity(offset: number, center: number, width: number) {
  const a = smoothstep(center - width, center - width * 0.3, offset);
  const b = 1 - smoothstep(center + width * 0.3, center + width, offset);
  return clamp01(Math.min(a, b));
}

function CardsOverlay() {
  const scroll = useScroll();
  const o = scroll.offset;

  return (
    // fixed = "same screen" feel; scroll only drives opacity/transform
    <div className="sticky top-0 w-screen h-[100dvh] z-[60] pointer-events-none">

     <div className="relative w-full h-full flex items-center justify-center px-6 pt-20 pb-32">
        {PANELS.map((p) => {
          const a = windowOpacity(o, p.center, p.width);
          const y = (1 - a) * 18;

          return (
            <div
              key={p.key}
              style={{ opacity: a, transform: `translateY(${y}px)` }}
              className="absolute w-full max-w-6xl pointer-events-auto"
            >
              <div className="mb-4 text-white/60 font-mono tracking-[0.3em] text-xs">
                {p.title}
              </div>

              {/* Add as many cards as you want; grid will wrap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {p.cards.map((c) => (
                  <div
                    key={c.title}
                    className="rounded-2xl bg-white/5 border border-white/10 p-6 text-white"
                  >
                    <div className="font-semibold">{c.title}</div>
                    {c.body && <div className="text-white/60 mt-2 text-sm">{c.body}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


export const Experience: React.FC = () => {
  return (
    <ScrollControls pages={5} damping={0.2}>
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

      {/* ✅ ADD THIS */}
      <Scroll html>
        <CardsOverlay />
      </Scroll>
    </ScrollControls>
  );
};
