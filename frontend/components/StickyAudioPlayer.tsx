import React, { useEffect, useMemo, useRef } from "react"
import Image from "next/image"
import Waveform from "./Waveform"

type Track = {
  id: number
  title: string
  artist: string | null
  duration_ms: number | null
  waveform_peaks: number[] | null
  cover_url?: string | null
  stream_url: string
}

type StickyAudioPlayerProps = {
  track: Track | null
}

function formatMs(ms: number | null | undefined) {
  if (!ms || ms <= 0) return "–"
  const totalSeconds = Math.round(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = String(totalSeconds % 60).padStart(2, "0")
  return `${m}:${s}`
}

export default function StickyAudioPlayer({ track }: StickyAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!track) return
    // Best-effort autoplay when selecting a track.
    audioRef.current?.play().catch(() => {})
  }, [track])

  const subtitle = useMemo(() => {
    if (!track) return ""
    const who = track.artist?.trim() ? track.artist : "Unbekannter Künstler"
    const dur = formatMs(track.duration_ms)
    return `${who} · ${dur}`
  }, [track])

  if (!track) return null

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        background: "#fff",
        borderTop: "1px solid #eee",
        boxShadow: "0 -2px 12px #eee",
        padding: "12px 16px",
        zIndex: 2000,
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {track.cover_url ? (
            <Image
              src={track.cover_url}
              alt="cover"
              width={48}
              height={48}
              style={{ borderRadius: 8, objectFit: "cover", background: "#f3f3f3" }}
            />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: 8, background: "#f3f3f3" }} />
          )}

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {track.title}
            </div>
            <div style={{ color: "#666", fontSize: 13 }}>{subtitle}</div>
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <Waveform peaks={track.waveform_peaks} height={46} />
        </div>

        <div style={{ marginTop: 10 }}>
          <audio
            ref={audioRef}
            controls
            preload="metadata"
            style={{ width: "100%" }}
            src={track.stream_url}
          />
        </div>
      </div>
    </div>
  )
}
