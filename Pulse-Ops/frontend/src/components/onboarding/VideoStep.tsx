"use client";

import React, { useState } from "react";

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" };

interface VideoStepProps {
  onNext: () => void;
  videoUrl?: string; // override prop; falls back to env var
}

export function VideoStep({ onNext, videoUrl }: VideoStepProps) {
  const [iframeError, setIframeError] = useState(false);
  const resolvedUrl =
    videoUrl ?? process.env.NEXT_PUBLIC_INTRO_VIDEO_URL ?? "";

  const hasVideo = !!resolvedUrl && !iframeError;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "inline-block",
            ...MONO,
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: "#7C71E8",
            background: "rgba(83,74,183,0.12)",
            border: "1px solid rgba(83,74,183,0.25)",
            padding: "4px 10px",
            borderRadius: "6px",
            marginBottom: "14px",
          }}
        >
          Step 2 of 6 — Demo
        </div>

        <h2
          style={{
            fontSize: "22px",
            fontWeight: 600,
            color: "#ffffff",
            marginBottom: "10px",
            letterSpacing: "-0.01em",
          }}
        >
          See Pulse-Ops in action
        </h2>
        <p style={{ fontSize: "14px", color: "#a0a0b0", lineHeight: 1.6 }}>
          Watch how your verified activity becomes your strongest application —
          in under 2 minutes.
        </p>
      </div>

      {/* Video container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "56.25%", // 16:9
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "#111127",
          marginBottom: "16px",
        }}
      >
        {hasVideo ? (
          <iframe
            src={resolvedUrl}
            title="Pulse-Ops intro video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onError={() => setIframeError(true)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: "none",
            }}
          />
        ) : (
          /* Placeholder */
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#111127",
              gap: "16px",
            }}
          >
            {/* Subtle grid overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "linear-gradient(rgba(83,74,183,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(83,74,183,0.04) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            {/* Play button */}
            <PlayButton />

            <div style={{ position: "relative", textAlign: "center" }}>
              <p
                style={{
                  ...MONO,
                  fontSize: "12px",
                  color: "#4a4a6a",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Video coming soon
              </p>
              <p style={{ fontSize: "12px", color: "#3a3a5a", marginTop: "4px" }}>
                Set{" "}
                <code
                  style={{
                    ...MONO,
                    color: "#534AB7",
                    background: "rgba(83,74,183,0.15)",
                    padding: "1px 5px",
                    borderRadius: "4px",
                    fontSize: "11px",
                  }}
                >
                  NEXT_PUBLIC_INTRO_VIDEO_URL
                </code>{" "}
                to embed a video
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Callout card */}
      <div
        style={{
          background: "#111127",
          border: "1px solid rgba(255,255,255,0.06)",
          borderLeft: "3px solid #534AB7",
          borderRadius: "0 8px 8px 0",
          padding: "16px 18px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            ...MONO,
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#7C71E8",
            marginBottom: "8px",
          }}
        >
          What you'll see
        </div>
        <p style={{ fontSize: "13px", color: "#a0a0b0", lineHeight: 1.7 }}>
          A real candidate's GitHub activity gets ingested, scored, and matched
          to an open role — then the agent drafts and submits a verified
          application, all in under 90 seconds.
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px" }}>
        <button
          onClick={onNext}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#a0a0b0",
            borderRadius: "8px",
            padding: "11px 22px",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "border-color 0.15s, color 0.15s",
            ...MONO,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.4)";
            (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)";
            (e.currentTarget as HTMLButtonElement).style.color = "#a0a0b0";
          }}
        >
          Skip video
        </button>

        <button
          onClick={onNext}
          style={{
            background: "#534AB7",
            border: "1px solid transparent",
            color: "#ffffff",
            borderRadius: "8px",
            padding: "11px 28px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 18px rgba(83,74,183,0.35)",
            transition: "background 0.15s, box-shadow 0.15s",
            ...MONO,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "#6358c7";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 26px rgba(83,74,183,0.5)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "#534AB7";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 18px rgba(83,74,183,0.35)";
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

/** Animated play button SVG — pure inline, no deps */
function PlayButton() {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ position: "relative", cursor: "pointer" }}>
      {/* Glow ring */}
      <div
        style={{
          position: "absolute",
          inset: "-10px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(83,74,183,0.25) 0%, transparent 70%)",
          transition: "opacity 0.2s",
          opacity: hovered ? 1 : 0.5,
        }}
      />
      {/* Circle */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: hovered ? "#6358c7" : "#534AB7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.2s, transform 0.2s",
          transform: hovered ? "scale(1.08)" : "scale(1)",
          boxShadow: "0 0 0 8px rgba(83,74,183,0.12)",
          position: "relative",
        }}
      >
        {/* Triangle */}
        <div
          style={{
            width: 0,
            height: 0,
            borderTop: "9px solid transparent",
            borderBottom: "9px solid transparent",
            borderLeft: "16px solid #ffffff",
            marginLeft: "4px",
          }}
        />
      </div>
    </div>
  );
}
