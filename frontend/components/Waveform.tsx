"use client"

import React from "react"
import { theme } from "@/styles/theme"

type WaveformProps = {
  peaks?: number[] | null
  height?: number
  progress?: number
}

export default function Waveform({ peaks, height = 40, progress = 0 }: WaveformProps) {
  const safePeaks = Array.isArray(peaks) ? peaks : []
  if (safePeaks.length === 0) {
    return (
      <div
        style={{
          height,
          width: "100%",
          background: theme.waveform.emptyBg,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: theme.waveform.emptyText, fontSize: 12 }}>Keine Waveform verfügbar</span>
      </div>
    )
  }

  // Interpoliere Peaks für mehr Detail
  const interpolatePeaks = (peaks: number[], targetCount: number): number[] => {
    if (peaks.length >= targetCount) return peaks
    const result: number[] = []
    const ratio = (peaks.length - 1) / (targetCount - 1)
    
    for (let i = 0; i < targetCount; i++) {
      const pos = i * ratio
      const index = Math.floor(pos)
      const fraction = pos - index
      
      if (index + 1 < peaks.length) {
        const interpolated = peaks[index] * (1 - fraction) + peaks[index + 1] * fraction
        result.push(interpolated)
      } else {
        result.push(peaks[index])
      }
    }
    return result
  }

  // Ziel: mindestens 200 Bars für detaillierte Darstellung
  const targetPeakCount = Math.max(200, safePeaks.length)
  const displayPeaks = interpolatePeaks(safePeaks, targetPeakCount)
  const max = Math.max(0.0001, ...displayPeaks.map((p) => Math.abs(p)))

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        height,
        width: "100%",
        background: "transparent",
        borderRadius: 6,
        overflow: "hidden",
        padding: "0 4px",
        boxSizing: "border-box",
      }}
    >
      {displayPeaks.map((p, i) => {
        const v = Math.min(1, Math.abs(p) / max)
        const barHeight = Math.max(2, Math.round(v * (height - 8)))
        const isPlayed = (i / displayPeaks.length) * 100 < progress
        return (
          <div
            key={i}
            style={{
              width: 1.5,
              height: barHeight,
              background: isPlayed
                ? `linear-gradient(180deg, ${theme.waveform.barPlayedStart} 0%, ${theme.waveform.barPlayedEnd} 100%)`
                : `linear-gradient(180deg, ${theme.waveform.barUnplayedStart} 0%, ${theme.waveform.barUnplayedEnd} 100%)`,
              borderRadius: 1,
              transition: "background 0.2s",
              opacity: isPlayed ? 1 : 0.7,
            }}
          />
        )
      })}
    </div>
  )
}

