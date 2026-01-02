"use client"

import React from "react"
import { theme } from "@/styles/theme"

type LevelMeterProps = {
  leftLevel: number // 0-1
  rightLevel: number // 0-1
}

export default function LevelMeter({ leftLevel, rightLevel }: LevelMeterProps) {
  const segmentCount = 7
  const greenSegments = 4
  const yellowSegments = 2
  const redSegments = 1

  const renderChannel = (level: number) => {
    const segments = []
    const activeSegments = Math.round(level * segmentCount)

    for (let i = 0; i < segmentCount; i++) {
      let color = "#333" // inaktiv
      const isActive = i < activeSegments

      if (isActive) {
        if (i < greenSegments) {
          color = theme.levelMeter.green
        } else if (i < greenSegments + yellowSegments) {
          color = theme.levelMeter.yellow
        } else {
          color = theme.levelMeter.red
        }
      }

      segments.push(
        <div
          key={i}
          style={{
            height: 6,
            background: color,
            borderRadius: 2,
            transition: "background 0.05s",
          }}
        />
      )
    }

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column-reverse",
          gap: 2,
          width: 6,
        }}
      >
        {segments}
      </div>
    )
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        alignItems: "center",
        padding: "0 8px",
      }}
    >
      <div style={{ fontSize: 10, color: theme.player.timeColor, marginRight: 4 }}>L</div>
      {renderChannel(leftLevel)}
      {renderChannel(rightLevel)}
      <div style={{ fontSize: 10, color: theme.player.timeColor, marginLeft: 4 }}>R</div>
    </div>
  )
}
