// Color quantization algorithms
// All accept pixels [[r,g,b],...] (sampled) and return palette [[r,g,b],...]

function dist2(a, b) {
  const dr = a[0]-b[0], dg = a[1]-b[1], db = a[2]-b[2]
  return dr*dr + dg*dg + db*db
}

/** Sample up to maxSamples pixels from ImageData */
export function samplePixels(data, width, height, maxSamples = 12000) {
  const total = width * height
  const step = Math.max(1, Math.floor(total / maxSamples))
  const pixels = []
  for (let i = 0; i < total; i += step) {
    const idx = i * 4
    if (data[idx + 3] < 128) continue
    pixels.push([data[idx], data[idx+1], data[idx+2]])
  }
  return pixels
}

/** Median Cut quantization */
export function medianCut(pixels, numColors) {
  if (!pixels.length) return [[0,0,0]]
  numColors = Math.max(1, Math.min(numColors, 256))

  let buckets = [pixels.slice()]

  while (buckets.length < numColors) {
    let maxRange = -1, splitIdx = 0, splitCh = 0

    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i]
      if (!b.length) continue
      for (let c = 0; c < 3; c++) {
        let mn = 255, mx = 0
        for (const p of b) {
          if (p[c] < mn) mn = p[c]
          if (p[c] > mx) mx = p[c]
        }
        if (mx - mn > maxRange) {
          maxRange = mx - mn; splitIdx = i; splitCh = c
        }
      }
    }

    if (maxRange === 0) break

    const b = buckets[splitIdx]
    b.sort((a, z) => a[splitCh] - z[splitCh])
    const mid = Math.floor(b.length / 2)
    buckets.splice(splitIdx, 1, b.slice(0, mid), b.slice(mid))
  }

  return buckets
    .filter(b => b.length > 0)
    .map(b => {
      let sr = 0, sg = 0, sb = 0
      for (const p of b) { sr += p[0]; sg += p[1]; sb += p[2] }
      const n = b.length
      return [Math.round(sr/n), Math.round(sg/n), Math.round(sb/n)]
    })
}

/** Octree-based quantization */
export function octreeQuantize(pixels, numColors) {
  if (!pixels.length) return [[0,0,0]]
  numColors = Math.max(1, Math.min(numColors, 256))

  // Group by quantized bit levels, find depth that gives ~numColors
  for (let bits = 1; bits <= 8; bits++) {
    const shift = 8 - bits
    const map = new Map()
    for (const [r, g, b] of pixels) {
      const qr = (r >> shift) << shift
      const qg = (g >> shift) << shift
      const qb = (b >> shift) << shift
      const key = (qr << 16) | (qg << 8) | qb
      let c = map.get(key)
      if (!c) { c = { sr: 0, sg: 0, sb: 0, n: 0 }; map.set(key, c) }
      c.sr += r; c.sg += g; c.sb += b; c.n++
    }
    if (map.size >= numColors || bits === 8) {
      const palette = Array.from(map.values()).map(c => [
        Math.round(c.sr/c.n), Math.round(c.sg/c.n), Math.round(c.sb/c.n)
      ])
      if (palette.length > numColors) return medianCut(pixels, numColors)
      return palette
    }
  }
  return medianCut(pixels, numColors)
}

/** K-Means quantization */
export function kMeans(pixels, k, maxIter = 20) {
  if (!pixels.length) return [[0,0,0]]
  k = Math.max(1, Math.min(k, pixels.length))

  // k-means++ initialization
  const centroids = [pixels[Math.floor(Math.random() * pixels.length)].slice()]
  while (centroids.length < k) {
    const dists = pixels.map(p => {
      let min = Infinity
      for (const c of centroids) { const d = dist2(p, c); if (d < min) min = d }
      return min
    })
    const sum = dists.reduce((a, b) => a + b, 0)
    let r = Math.random() * sum
    for (let i = 0; i < pixels.length; i++) {
      r -= dists[i]
      if (r <= 0) { centroids.push(pixels[i].slice()); break }
    }
    if (centroids.length < k) centroids.push(pixels[Math.floor(Math.random() * pixels.length)].slice())
  }

  for (let iter = 0; iter < maxIter; iter++) {
    const clusters = Array.from({ length: k }, () => ({ sr: 0, sg: 0, sb: 0, n: 0 }))
    for (const p of pixels) {
      let minD = Infinity, best = 0
      for (let i = 0; i < k; i++) {
        const d = dist2(p, centroids[i]); if (d < minD) { minD = d; best = i }
      }
      clusters[best].sr += p[0]; clusters[best].sg += p[1]; clusters[best].sb += p[2]; clusters[best].n++
    }
    let changed = false
    for (let i = 0; i < k; i++) {
      if (!clusters[i].n) {
        centroids[i] = pixels[Math.floor(Math.random() * pixels.length)].slice()
        changed = true; continue
      }
      const nr = Math.round(clusters[i].sr / clusters[i].n)
      const ng = Math.round(clusters[i].sg / clusters[i].n)
      const nb = Math.round(clusters[i].sb / clusters[i].n)
      if (nr !== centroids[i][0] || ng !== centroids[i][1] || nb !== centroids[i][2]) {
        centroids[i] = [nr, ng, nb]; changed = true
      }
    }
    if (!changed) break
  }
  return centroids
}

/** Build palette from image data using given method */
export function buildPalette(data, width, height, method, numColors, customColors) {
  if (method === 'custom') {
    if (!customColors || !customColors.length) return [[0,0,0],[255,255,255]]
    return customColors.map(hex => hexToRgb(hex))
  }
  const pixels = samplePixels(data, width, height)
  if (!pixels.length) return [[0,0,0]]
  if (method === 'median-cut') return medianCut(pixels, numColors)
  if (method === 'k-means') return kMeans(pixels, numColors)
  if (method === 'octree') return octreeQuantize(pixels, numColors)
  return medianCut(pixels, numColors)
}

export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return [r || 0, g || 0, b || 0]
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2,'0')).join('')
}
