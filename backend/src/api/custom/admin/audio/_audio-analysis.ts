import { spawn } from "child_process"

export type AudioAnalysis = {
  durationMs: number | null
  peaks: number[] | null
}

function runCapture(cmd: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] })
    let stdout = ""
    let stderr = ""

    child.stdout.setEncoding("utf8")
    child.stderr.setEncoding("utf8")

    child.stdout.on("data", (d) => (stdout += d))
    child.stderr.on("data", (d) => (stderr += d))

    child.on("error", reject)
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr })
    })
  })
}

export async function probeDurationMs(filePath: string): Promise<number | null> {
  // ffprobe outputs duration in seconds
  const { code, stdout } = await runCapture("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ])

  if (code !== 0) return null

  const seconds = Number(String(stdout).trim())
  if (!Number.isFinite(seconds) || seconds <= 0) return null

  return Math.max(0, Math.trunc(seconds * 1000))
}

export async function computeWaveformPeaks(
  filePath: string,
  durationMs: number,
  opts?: { sampleRate?: number; peaksCount?: number }
): Promise<number[] | null> {
  const sampleRate = opts?.sampleRate ?? 8000
  const peaksCount = opts?.peaksCount ?? 1000

  const durationSeconds = durationMs / 1000
  const totalSamples = Math.max(1, Math.floor(durationSeconds * sampleRate))
  const bucketSize = Math.max(1, Math.ceil(totalSamples / peaksCount))

  return new Promise((resolve, reject) => {
    const args = [
      "-v",
      "error",
      "-i",
      filePath,
      "-ac",
      "1",
      "-ar",
      String(sampleRate),
      "-f",
      "f32le",
      "pipe:1",
    ]

    const ff = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] })
    ff.on("error", reject)

    // accumulate float32 samples across chunk boundaries
    let leftover: Buffer | null = null

    let sampleIndex = 0
    let currentPeak = 0
    let currentCount = 0
    const peaks: number[] = []

    function pushSample(sample: number) {
      const abs = Math.abs(sample)
      if (abs > currentPeak) currentPeak = abs

      currentCount++
      sampleIndex++

      if (currentCount >= bucketSize) {
        peaks.push(Number(currentPeak.toFixed(6)))
        currentPeak = 0
        currentCount = 0

        if (peaks.length >= peaksCount) {
          // stop early
          ff.kill("SIGKILL")
        }
      }
    }

    ff.stdout.on("data", (chunk: Buffer) => {
      const buf = leftover ? Buffer.concat([leftover, chunk]) : chunk
      const usable = buf.length - (buf.length % 4)
      leftover = usable < buf.length ? buf.subarray(usable) : null

      for (let offset = 0; offset < usable; offset += 4) {
        const sample = buf.readFloatLE(offset)
        pushSample(sample)
      }
    })

    ff.stderr.on("data", () => {
      // keep quiet
    })

    ff.on("close", () => {
      // finalize last bucket
      if (currentCount > 0 && peaks.length < peaksCount) {
        peaks.push(Number(currentPeak.toFixed(6)))
      }

      // normalize count exactly
      if (peaks.length > peaksCount) peaks.length = peaksCount
      while (peaks.length < peaksCount) peaks.push(0)

      resolve(peaks)
    })
  })
}

export async function computeWaveformPeaksAudiowaveform(
  filePath: string,
  opts?: { peaksCount?: number; zoom?: number; bits?: 8 | 16 }
): Promise<number[] | null> {
  const peaksCount = opts?.peaksCount ?? 1000
  const zoom = opts?.zoom ?? 256
  const bits = opts?.bits ?? 8

  const { code, stdout } = await runCapture("audiowaveform", [
    "-i",
    filePath,
    "-o",
    "-",
    "--output-format",
    "json",
    "-z",
    String(zoom),
    "-b",
    String(bits),
    "-q",
  ])

  if (code !== 0) return null

  let parsed: any
  try {
    parsed = JSON.parse(stdout)
  } catch {
    return null
  }

  const data: unknown = parsed?.data
  if (!Array.isArray(data)) return null

  const values = data.filter((x) => typeof x === "number") as number[]
  if (values.length < 2) return null

  const pairCount = Math.floor(values.length / 2)
  if (pairCount <= 0) return null

  const amps: number[] = new Array(pairCount)
  for (let i = 0; i < pairCount; i++) {
    const min = values[i * 2]
    const max = values[i * 2 + 1]
    amps[i] = Math.max(Math.abs(min), Math.abs(max))
  }

  const maxAmp = Math.max(0.000001, ...amps)

  const bucketSize = Math.max(1, Math.ceil(amps.length / peaksCount))
  const peaks: number[] = []

  for (let i = 0; i < amps.length && peaks.length < peaksCount; i += bucketSize) {
    let m = 0
    const end = Math.min(amps.length, i + bucketSize)
    for (let j = i; j < end; j++) {
      if (amps[j] > m) m = amps[j]
    }
    peaks.push(Number((m / maxAmp).toFixed(6)))
  }

  while (peaks.length < peaksCount) peaks.push(0)
  if (peaks.length > peaksCount) peaks.length = peaksCount

  return peaks
}

export async function analyzeAudio(filePath: string): Promise<AudioAnalysis> {
  const durationMs = await probeDurationMs(filePath)
  if (!durationMs) {
    return { durationMs: null, peaks: null }
  }

  const peaks =
    (await computeWaveformPeaksAudiowaveform(filePath).catch(() => null)) ??
    (await computeWaveformPeaks(filePath, durationMs).catch(() => null))
  return { durationMs, peaks }
}
