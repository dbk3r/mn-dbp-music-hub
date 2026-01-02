import React from "react"

type WaveformProps = {
  peaks?: number[] | null
  height?: number
}

export default function Waveform({ peaks, height = 40 }: WaveformProps) {
  const safePeaks = Array.isArray(peaks) ? peaks : []
  if (safePeaks.length === 0) {
    return (
      <div
        style={{
          height,
          width: "100%",
          background: "#f3f3f3",
          borderRadius: 6,
        }}
      />
    )
  }

  const max = Math.max(0.0001, ...safePeaks.map((p) => Math.abs(p)))

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        height,
        width: "100%",
        background: "#f3f3f3",
        borderRadius: 6,
        overflow: "hidden",
        padding: "0 4px",
        boxSizing: "border-box",
      }}
    >
      {safePeaks.map((p, i) => {
        const v = Math.min(1, Math.abs(p) / max)
        const barHeight = Math.max(2, Math.round(v * (height - 8)))
        return (
          <div
            key={i}
            style={{
              width: 2,
              height: barHeight,
              background: "#999",
              borderRadius: 2,
            }}
          />
        )
      })}
    </div>
  )
}
