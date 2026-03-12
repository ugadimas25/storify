interface PlayRippleProps {
  playing: boolean;
}

/**
 * CD holographic blob animation overlay.
 * Rainbow conic-gradient disc with organic blob morphing while audio plays.
 */
export function PlayRipple({ playing }: PlayRippleProps) {
  if (!playing) return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl"
      style={{ zIndex: 30, background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      <style>{`
        @keyframes cd-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes blob-morph {
          0%,100% { border-radius: 62% 38% 34% 66% / 58% 32% 68% 42%; }
          20%     { border-radius: 44% 56% 68% 32% / 46% 66% 34% 54%; }
          40%     { border-radius: 56% 44% 28% 72% / 64% 38% 62% 36%; }
          60%     { border-radius: 38% 62% 60% 40% / 36% 58% 42% 64%; }
          80%     { border-radius: 70% 30% 46% 54% / 52% 70% 30% 48%; }
        }
      `}</style>

      {/* Holographic spinning disc */}
      <div
        style={{
          width: "82%",
          aspectRatio: "1 / 1",
          background: `conic-gradient(
            from 0deg,
            hsl(130,55%,68%),
            hsl(175,60%,68%),
            hsl(210,65%,72%),
            hsl(255,60%,75%),
            hsl(300,55%,70%),
            hsl(340,60%,68%),
            hsl(20,65%,68%),
            hsl(50,65%,68%),
            hsl(90,55%,68%),
            hsl(130,55%,68%)
          )`,
          animation: "cd-spin 5s linear infinite, blob-morph 7s ease-in-out infinite",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Center hole */}
        <div
          style={{
            position: "absolute",
            width: "38%",
            aspectRatio: "1 / 1",
            borderRadius: "50%",
            background: "#181818",
            border: "1.5px solid rgba(255,255,255,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          {/* Inner ring 1 */}
          <div
            style={{
              width: "68%",
              aspectRatio: "1 / 1",
              borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Inner ring 2 / hole */}
            <div
              style={{
                width: "52%",
                aspectRatio: "1 / 1",
                borderRadius: "50%",
                background: "#111",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
