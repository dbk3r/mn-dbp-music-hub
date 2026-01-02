"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Waveform from "./Waveform"
import LevelMeter from "./LevelMeter"
import { theme } from "@/styles/theme"

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
  if (!ms || ms <= 0) return "0:00"
  const totalSeconds = Math.round(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = String(totalSeconds % 60).padStart(2, "0")
  return `${m}:${s}`
}

export default function StickyAudioPlayer({ track }: StickyAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [leftLevel, setLeftLevel] = useState(0)
  const [rightLevel, setRightLevel] = useState(0)
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserLeftRef = useRef<AnalyserNode | null>(null)
  const analyserRightRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!track) return
    
    const audio = audioRef.current
    if (!audio) return

    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    
    audio.load()
    
    // Setup Web Audio API für Pegelanalyse
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = audioContextRef.current.createMediaElementSource(audio)
      const splitter = audioContextRef.current.createChannelSplitter(2)
      
      // Linker Kanal
      const analyserLeft = audioContextRef.current.createAnalyser()
      analyserLeft.fftSize = 256
      analyserLeft.smoothingTimeConstant = 0.8
      analyserLeftRef.current = analyserLeft
      
      // Rechter Kanal
      const analyserRight = audioContextRef.current.createAnalyser()
      analyserRight.fftSize = 256
      analyserRight.smoothingTimeConstant = 0.8
      analyserRightRef.current = analyserRight
      
      source.connect(splitter)
      splitter.connect(analyserLeft, 0)
      splitter.connect(analyserRight, 1)
      source.connect(audioContextRef.current.destination)
    }
    
    // Best-effort autoplay when selecting a track
    const playPromise = audio.play()
    if (playPromise) {
      playPromise.catch(() => {
        console.log("Autoplay prevented")
      })
    }
  }, [track])

  // Audio-Pegel Analyse
  useEffect(() => {
    if (!isPlaying) {
      setLeftLevel(0)
      setRightLevel(0)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    const updateLevels = () => {
      if (analyserLeftRef.current && analyserRightRef.current) {
        const dataArrayLeft = new Uint8Array(analyserLeftRef.current.frequencyBinCount)
        const dataArrayRight = new Uint8Array(analyserRightRef.current.frequencyBinCount)
        
        analyserLeftRef.current.getByteFrequencyData(dataArrayLeft)
        analyserRightRef.current.getByteFrequencyData(dataArrayRight)
        
        // RMS Berechnung für genauere Pegelanzeige
        const rmsLeft = Math.sqrt(dataArrayLeft.reduce((sum, val) => sum + val * val, 0) / dataArrayLeft.length) / 255
        const rmsRight = Math.sqrt(dataArrayRight.reduce((sum, val) => sum + val * val, 0) / dataArrayRight.length) / 255
        
        setLeftLevel(rmsLeft)
        setRightLevel(rmsRight)
      }
      
      animationFrameRef.current = requestAnimationFrame(updateLevels)
    }
    
    updateLevels()
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => {
      setIsPlaying(true)
    }
    const handlePause = () => {
      setIsPlaying(false)
    }
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }
    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [track])

  const subtitle = useMemo(() => {
    if (!track) return ""
    const who = track.artist?.trim() ? track.artist : "Unbekannter Künstler"
    return who
  }, [track])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return
    
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch((err) => {
        console.error("Play failed:", err)
      })
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, clickX / rect.width))
    audio.currentTime = percent * duration
  }

  if (!track) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(180deg, ${theme.player.bgStart} 0%, ${theme.player.bgEnd} 100%)`,
        borderTop: `1px solid ${theme.player.border}`,
        boxShadow: `0 -4px 20px ${theme.player.shadow}`,
        padding: "16px 24px",
        zIndex: 2000,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          {track.cover_url ? (
            <Image
              src={track.cover_url}
              alt="cover"
              width={56}
              height={56}
              style={{
                borderRadius: 8,
                objectFit: "cover",
                background: theme.player.coverBg,
                boxShadow: `0 2px 8px ${theme.player.coverShadow}`,
              }}
            />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: 8, background: theme.player.coverBg }} />
          )}

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 16,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: theme.colors.foreground,
              }}
            >
              {track.title}
            </div>
            <div style={{ color: theme.player.timeColor, fontSize: 14, marginTop: 2 }}>{subtitle}</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: theme.player.timeColor, minWidth: 45, textAlign: "right" }}>
              {formatMs(currentTime * 1000)}
            </span>
            <button
              onClick={togglePlayPause}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: theme.player.buttonBg,
                border: "none",
                color: theme.colors.foreground,
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                boxShadow: `0 2px 8px ${theme.player.buttonShadow}`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <span style={{ fontSize: 13, color: theme.player.timeColor, minWidth: 45 }}>
              {formatMs(track.duration_ms || duration * 1000)}
            </span>
            <LevelMeter leftLevel={leftLevel} rightLevel={rightLevel} />
          </div>
        </div>

        <div
          onClick={handleSeek}
          style={{
            position: "relative",
            height: 60,
            width: "100%",
            cursor: "pointer",
            borderRadius: 8,
            overflow: "hidden",
            background: theme.player.waveformBg,
          }}
        >
          <Waveform peaks={track.waveform_peaks} height={60} progress={progress} />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${progress}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${theme.player.progressOverlay} 0%, ${theme.player.progressOverlayEnd} 100%)`,
              pointerEvents: "none",
              transition: "width 0.1s linear",
            }}
          />
        </div>

        <audio
          ref={audioRef}
          preload="metadata"
          src={track.stream_url}
          style={{ display: "none" }}
        />
      </div>
    </div>
  )
}
