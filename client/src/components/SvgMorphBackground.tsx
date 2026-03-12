import { memo } from "react";

/**
 * Animated floating orbs background using pure CSS keyframe animations.
 * Solid-color circles with box-shadow glow, clearly visible on dark gradient.
 */
const orbs = [
  { left: "10%",  top: "20%",  size: 200, bg: "rgba(255,255,255,0.18)", shadow: "0 0 80px 40px rgba(255,255,255,0.15)", anim: "float1", dur: "12s", delay: "0s" },
  { left: "75%",  top: "10%",  size: 180, bg: "rgba(161,218,180,0.22)", shadow: "0 0 80px 40px rgba(161,218,180,0.18)", anim: "float2", dur: "15s", delay: "2s" },
  { left: "85%",  top: "60%",  size: 140, bg: "rgba(65,182,196,0.20)",  shadow: "0 0 60px 30px rgba(65,182,196,0.15)", anim: "float3", dur: "10s", delay: "1s" },
  { left: "25%",  top: "70%",  size: 170, bg: "rgba(255,255,255,0.14)", shadow: "0 0 70px 35px rgba(255,255,255,0.12)", anim: "float1", dur: "14s", delay: "3s" },
  { left: "50%",  top: "35%",  size: 120, bg: "rgba(255,255,204,0.16)", shadow: "0 0 60px 30px rgba(255,255,204,0.12)", anim: "float2", dur: "11s", delay: "4s" },
];

export const SvgMorphBackground = memo(function SvgMorphBackground() {
  return (
    <>
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(40px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.92); }
          75% { transform: translate(30px, 15px) scale(1.06); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-35px, 25px) scale(1.12); }
          50% { transform: translate(25px, -35px) scale(0.9); }
          75% { transform: translate(-15px, -20px) scale(1.08); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, 30px) scale(1.15); }
          66% { transform: translate(-25px, -15px) scale(0.88); }
        }
      `}</style>
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        {orbs.map((orb, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: orb.left,
              top: orb.top,
              width: orb.size,
              height: orb.size,
              marginLeft: -orb.size / 2,
              marginTop: -orb.size / 2,
              borderRadius: "50%",
              backgroundColor: orb.bg,
              boxShadow: orb.shadow,
              animation: `${orb.anim} ${orb.dur} ${orb.delay} ease-in-out infinite`,
              willChange: "transform",
            }}
          />
        ))}
      </div>
    </>
  );
});
