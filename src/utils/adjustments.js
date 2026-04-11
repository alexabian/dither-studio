// Pure image processing — no DOM, safe to use inside a Web Worker

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [h, s, l]
}

function hslToRgb(h, s, l) {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v] }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  return [
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255),
  ]
}

function clamp(v, lo = 0, hi = 255) { return v < lo ? lo : v > hi ? hi : v }

function boxBlur(buf, w, h, radius) {
  if (radius < 1) return buf
  const temp = new Float32Array(buf.length)
  const out  = new Float32Array(buf.length)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sr = 0, sg = 0, sb = 0, n = 0
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = clamp(x + dx, 0, w - 1)
        const i = (y * w + nx) * 4
        sr += buf[i]; sg += buf[i+1]; sb += buf[i+2]; n++
      }
      const i = (y * w + x) * 4
      temp[i] = sr/n; temp[i+1] = sg/n; temp[i+2] = sb/n; temp[i+3] = buf[i+3]
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sr = 0, sg = 0, sb = 0, n = 0
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = clamp(y + dy, 0, h - 1)
        const i = (ny * w + x) * 4
        sr += temp[i]; sg += temp[i+1]; sb += temp[i+2]; n++
      }
      const i = (y * w + x) * 4
      out[i] = sr/n; out[i+1] = sg/n; out[i+2] = sb/n; out[i+3] = temp[i+3]
    }
  }
  return out
}

export function resizePixels(srcData, srcW, srcH, dstW, dstH) {
  const src = srcData instanceof Uint8ClampedArray ? srcData : new Uint8ClampedArray(srcData)
  const out = new Uint8ClampedArray(dstW * dstH * 4)
  const xr = srcW / dstW, yr = srcH / dstH

  for (let y = 0; y < dstH; y++) {
    for (let x = 0; x < dstW; x++) {
      const sx = x * xr, sy = y * yr
      const x1 = Math.floor(sx), y1 = Math.floor(sy)
      const x2 = Math.min(x1 + 1, srcW - 1), y2 = Math.min(y1 + 1, srcH - 1)
      const fx = sx - x1, fy = sy - y1
      const i00 = (y1 * srcW + x1) * 4, i10 = (y1 * srcW + x2) * 4
      const i01 = (y2 * srcW + x1) * 4, i11 = (y2 * srcW + x2) * 4
      const di = (y * dstW + x) * 4
      for (let c = 0; c < 4; c++) {
        out[di+c] = Math.round(
          src[i00+c]*(1-fx)*(1-fy) + src[i10+c]*fx*(1-fy) +
          src[i01+c]*(1-fx)*fy    + src[i11+c]*fx*fy
        )
      }
    }
  }
  return out
}

export function applyAdjustments(data, w, h, settings) {
  const { gamma, blacks, whites, contrast, saturation, hue,
          noiseCoverage, noiseIntensity, noiseSaturation,
          blurStrength, edgeStrength, blurPasses } = settings
  const n = w * h
  let buf = new Float32Array(n * 4)

  for (let i = 0; i < n; i++) {
    const idx = i * 4
    let r = data[idx] / 255, g = data[idx+1] / 255, b = data[idx+2] / 255
    const a = data[idx+3]

    // Gamma
    const invG = 1 / Math.max(0.01, gamma)
    r = Math.pow(Math.max(0, r), invG)
    g = Math.pow(Math.max(0, g), invG)
    b = Math.pow(Math.max(0, b), invG)

    // Blacks / Whites
    const ls = 1 + whites - blacks
    r = r * ls + blacks; g = g * ls + blacks; b = b * ls + blacks

    // Contrast
    r = (r - 0.5) * contrast + 0.5
    g = (g - 0.5) * contrast + 0.5
    b = (b - 0.5) * contrast + 0.5

    r = Math.max(0, Math.min(1, r))
    g = Math.max(0, Math.min(1, g))
    b = Math.max(0, Math.min(1, b))

    // Saturation + Hue
    if (saturation !== 1 || hue !== 0) {
      let [h_, s_, l_] = rgbToHsl(r * 255, g * 255, b * 255)
      h_ = ((h_ + hue / (2 * Math.PI)) % 1 + 1) % 1
      s_ = Math.max(0, Math.min(1, s_ * saturation))
      const [nr, ng, nb] = hslToRgb(h_, s_, l_)
      r = nr / 255; g = ng / 255; b = nb / 255
    }

    buf[idx] = r * 255; buf[idx+1] = g * 255; buf[idx+2] = b * 255; buf[idx+3] = a
  }

  // Noise
  if (noiseCoverage > 0 && noiseIntensity > 0) {
    for (let i = 0; i < n; i++) {
      if (Math.random() > noiseCoverage) continue
      const idx = i * 4, amp = noiseIntensity * 255
      if (noiseSaturation < 0.5) {
        const noise = (Math.random() - 0.5) * 2 * amp
        buf[idx] = clamp(buf[idx]+noise); buf[idx+1] = clamp(buf[idx+1]+noise); buf[idx+2] = clamp(buf[idx+2]+noise)
      } else {
        buf[idx]   = clamp(buf[idx]   + (Math.random()-0.5)*2*amp*noiseSaturation)
        buf[idx+1] = clamp(buf[idx+1] + (Math.random()-0.5)*2*amp*noiseSaturation)
        buf[idx+2] = clamp(buf[idx+2] + (Math.random()-0.5)*2*amp*noiseSaturation)
      }
    }
  }

  // Blur + Edge sharpening
  if (blurStrength > 0 || edgeStrength > 0) {
    for (let pass = 0; pass < blurPasses; pass++) {
      const blurR = Math.round(blurStrength / 6)
      const edgeFactor = edgeStrength / 20
      const smallBlur = boxBlur(buf, w, h, 1)

      if (blurR > 0) {
        const blurred = boxBlur(buf, w, h, blurR)
        for (let i = 0; i < buf.length; i += 4) {
          buf[i]   = clamp(blurred[i]   + (buf[i]   - blurred[i])   * edgeFactor)
          buf[i+1] = clamp(blurred[i+1] + (buf[i+1] - blurred[i+1]) * edgeFactor)
          buf[i+2] = clamp(blurred[i+2] + (buf[i+2] - blurred[i+2]) * edgeFactor)
          buf[i+3] = blurred[i+3]
        }
      } else if (edgeStrength > 0) {
        for (let i = 0; i < buf.length; i += 4) {
          buf[i]   = clamp(buf[i]   + (buf[i]   - smallBlur[i])   * edgeFactor)
          buf[i+1] = clamp(buf[i+1] + (buf[i+1] - smallBlur[i+1]) * edgeFactor)
          buf[i+2] = clamp(buf[i+2] + (buf[i+2] - smallBlur[i+2]) * edgeFactor)
        }
      }
    }
  }

  return buf
}

export function computeHistogram(pixels, w, h) {
  const r = new Uint32Array(256), g = new Uint32Array(256), b = new Uint32Array(256)
  const n = w * h
  for (let i = 0; i < n; i++) {
    const idx = i * 4
    r[pixels[idx]]++; g[pixels[idx+1]]++; b[pixels[idx+2]]++
  }
  return { r, g, b }
}
