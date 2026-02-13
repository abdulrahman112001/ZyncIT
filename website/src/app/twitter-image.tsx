import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "iRopit — Sync Your Devices Seamlessly";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(135deg, #1F2937 0%, #111827 50%, #0F172A 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decorations */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(213,193,158,0.25) 0%, transparent 70%)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -150,
          left: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
          display: "flex",
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "60px 80px",
        }}
      >
        {/* Left side */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            maxWidth: 650,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "linear-gradient(135deg, #D5C19E 0%, #B8A07A 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 800,
                color: "#1F2937",
              }}
            >
              iR
            </div>
            <span
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: "#F9FAFB",
              }}
            >
              iRopit
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: "#F9FAFB",
              lineHeight: 1.15,
              marginBottom: 20,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Sync Your Devices</span>
            <span
              style={{
                background: "linear-gradient(135deg, #D5C19E 0%, #E8DCC6 100%)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Seamlessly
            </span>
          </div>

          <p
            style={{
              fontSize: 22,
              color: "#9CA3AF",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            SMS, Calls, Notifications & Chat — all synced between your phone and
            computer with E2E encryption.
          </p>

          <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
            {["Android App", "Chrome Extension", "E2E Encrypted"].map((tag) => (
              <div
                key={tag}
                style={{
                  background: "rgba(213,193,158,0.15)",
                  border: "1px solid rgba(213,193,158,0.3)",
                  borderRadius: 20,
                  padding: "8px 16px",
                  fontSize: 14,
                  color: "#D5C19E",
                  fontWeight: 600,
                  display: "flex",
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background:
            "linear-gradient(90deg, #D5C19E 0%, #10B981 50%, #3B82F6 100%)",
          display: "flex",
        }}
      />
    </div>,
    { ...size },
  );
}
