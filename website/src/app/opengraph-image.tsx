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
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(213,193,158,0.08) 0%, transparent 70%)",
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
        {/* Left side - Text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            maxWidth: 600,
          }}
        >
          {/* Logo + Brand */}
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
                letterSpacing: "-0.02em",
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
              letterSpacing: "-0.03em",
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

          {/* Description */}
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

          {/* Tags */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 32,
            }}
          >
            {["Android App", "Chrome Extension", "End-to-End Encrypted"].map(
              (tag) => (
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
              ),
            )}
          </div>
        </div>

        {/* Right side - Phone mockup */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Phone frame */}
          <div
            style={{
              width: 220,
              height: 440,
              borderRadius: 32,
              border: "3px solid rgba(213,193,158,0.4)",
              background: "linear-gradient(180deg, #1F2937 0%, #111827 100%)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
            }}
          >
            {/* Phone header */}
            <div
              style={{
                background: "linear-gradient(135deg, #D5C19E 0%, #B8A07A 100%)",
                padding: "20px 16px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#1F2937",
                }}
              >
                iR
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{ color: "#1F2937", fontSize: 14, fontWeight: 700 }}
                >
                  iRopit
                </span>
                <span style={{ color: "rgba(31,41,55,0.6)", fontSize: 10 }}>
                  All synced ✓
                </span>
              </div>
            </div>

            {/* Phone content */}
            <div
              style={{
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                flex: 1,
              }}
            >
              {[
                {
                  icon: "💬",
                  label: "New SMS",
                  detail: "Hey! Are you...",
                  color: "#3B82F6",
                },
                {
                  icon: "📞",
                  label: "Missed Call",
                  detail: "2 min ago",
                  color: "#10B981",
                },
                {
                  icon: "🔔",
                  label: "WhatsApp",
                  detail: "New message",
                  color: "#F59E0B",
                },
                {
                  icon: "📎",
                  label: "File Shared",
                  detail: "photo.jpg",
                  color: "#D5C19E",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "#374151",
                    borderRadius: 12,
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      background: `${item.color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#F9FAFB",
                      }}
                    >
                      {item.label}
                    </span>
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>
                      {item.detail}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating badges */}
          <div
            style={{
              position: "absolute",
              top: 20,
              right: -30,
              background: "#10B981",
              color: "white",
              fontSize: 12,
              fontWeight: 700,
              padding: "6px 14px",
              borderRadius: 20,
              display: "flex",
            }}
          >
            🔒 Encrypted
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 80,
              left: -40,
              background: "#3B82F6",
              color: "white",
              fontSize: 12,
              fontWeight: 700,
              padding: "6px 14px",
              borderRadius: 20,
              display: "flex",
            }}
          >
            ⚡ Real-time
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
    {
      ...size,
    },
  );
}
