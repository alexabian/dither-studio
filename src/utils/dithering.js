// Dithering algorithms — worker-safe, no DOM

function nearest(r, g, b, palette) {
  let best = palette[0], bestD = Infinity
  for (const c of palette) {
    const dr = r-c[0], dg = g-c[1], db = b-c[2]
    const d = dr*dr + dg*dg + db*db
    if (d < bestD) { bestD = d; best = c }
  }
  return best
}

// Error diffusion kernels: [dx, dy, weight]
const KERNELS = {
  'floyd-steinberg': [
    [1,0,7/16],[-1,1,3/16],[0,1,5/16],[1,1,1/16],
  ],
  'jarvis': [
    [1,0,7/48],[2,0,5/48],
    [-2,1,3/48],[-1,1,5/48],[0,1,7/48],[1,1,5/48],[2,1,3/48],
    [-2,2,1/48],[-1,2,3/48],[0,2,5/48],[1,2,3/48],[2,2,1/48],
  ],
  'stucki': [
    [1,0,8/42],[2,0,4/42],
    [-2,1,2/42],[-1,1,4/42],[0,1,8/42],[1,1,4/42],[2,1,2/42],
    [-2,2,1/42],[-1,2,2/42],[0,2,4/42],[1,2,2/42],[2,2,1/42],
  ],
  'atkinson': [
    [1,0,1/8],[2,0,1/8],[-1,1,1/8],[0,1,1/8],[1,1,1/8],[0,2,1/8],
  ],
  'burkes': [
    [1,0,8/32],[2,0,4/32],
    [-2,1,2/32],[-1,1,4/32],[0,1,8/32],[1,1,4/32],[2,1,2/32],
  ],
  'sierra': [
    [1,0,5/32],[2,0,3/32],
    [-2,1,2/32],[-1,1,4/32],[0,1,5/32],[1,1,4/32],[2,1,2/32],
    [-1,2,2/32],[0,2,3/32],[1,2,2/32],
  ],
  'two-row-sierra': [
    [1,0,4/16],[2,0,3/16],
    [-2,1,1/16],[-1,1,2/16],[0,1,3/16],[1,1,2/16],[2,1,1/16],
  ],
  'sierra-lite': [
    [1,0,2/4],[-1,1,1/4],[0,1,1/4],
  ],
}

const BAYER8 = [
  [ 0,32, 8,40, 2,34,10,42],
  [48,16,56,24,50,18,58,26],
  [12,44, 4,36,14,46, 6,38],
  [60,28,52,20,62,30,54,22],
  [ 3,35,11,43, 1,33, 9,41],
  [51,19,59,27,49,17,57,25],
  [15,47, 7,39,13,45, 5,37],
  [63,31,55,23,61,29,53,21],
]

// Error diffusion with serpentine scanning
function errorDiffuse(pixels, w, h, palette, kernel, amount, diffusion, serpentine = true) {
  const buf = new Float32Array(pixels)
  const out = new Uint8ClampedArray(w * h * 4)
  const scale = amount * diffusion

  for (let y = 0; y < h; y++) {
    // Serpentine: even rows L→R, odd rows R→L
    const ltr = !serpentine || (y % 2 === 0)

    for (let xi = 0; xi < w; xi++) {
      const x = ltr ? xi : (w - 1 - xi)
      const i = (y * w + x) * 4
      const r = Math.max(0, Math.min(255, buf[i]))
      const g = Math.max(0, Math.min(255, buf[i+1]))
      const b = Math.max(0, Math.min(255, buf[i+2]))

      const [nr, ng, nb] = nearest(r, g, b, palette)
      out[i] = nr; out[i+1] = ng; out[i+2] = nb; out[i+3] = Math.round(buf[i+3])

      const er = (r - nr) * scale
      const eg = (g - ng) * scale
      const eb = (b - nb) * scale

      for (const [dx, dy, wt] of kernel) {
        // Mirror x offset on right-to-left rows
        const nx = x + (ltr ? dx : -dx)
        const ny = y + dy
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const ni = (ny * w + nx) * 4
          buf[ni]   += er * wt
          buf[ni+1] += eg * wt
          buf[ni+2] += eb * wt
        }
      }
    }
  }
  return out
}

function orderedDither(pixels, w, h, palette, matrix, matSize, amount, diffusion) {
  const out = new Uint8ClampedArray(w * h * 4)
  const spread = amount * diffusion * 255
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const t = (matrix[y % matSize][x % matSize] / (matSize * matSize) - 0.5) * spread
      const r = Math.max(0, Math.min(255, pixels[i]   + t))
      const g = Math.max(0, Math.min(255, pixels[i+1] + t))
      const b = Math.max(0, Math.min(255, pixels[i+2] + t))
      const [nr, ng, nb] = nearest(r, g, b, palette)
      out[i] = nr; out[i+1] = ng; out[i+2] = nb; out[i+3] = Math.round(pixels[i+3])
    }
  }
  return out
}

function randomDither(pixels, w, h, palette, amount, diffusion) {
  const out = new Uint8ClampedArray(w * h * 4)
  const amp = amount * diffusion * 128
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const noise = (Math.random() - 0.5) * 2 * amp
      const r = Math.max(0, Math.min(255, pixels[i]   + noise))
      const g = Math.max(0, Math.min(255, pixels[i+1] + noise))
      const b = Math.max(0, Math.min(255, pixels[i+2] + noise))
      const [nr, ng, nb] = nearest(r, g, b, palette)
      out[i] = nr; out[i+1] = ng; out[i+2] = nb; out[i+3] = Math.round(pixels[i+3])
    }
  }
  return out
}

function noOp(pixels, w, h, palette) {
  const out = new Uint8ClampedArray(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    const idx = i * 4
    const [nr, ng, nb] = nearest(
      Math.max(0, Math.min(255, pixels[idx])),
      Math.max(0, Math.min(255, pixels[idx+1])),
      Math.max(0, Math.min(255, pixels[idx+2])),
      palette
    )
    out[idx] = nr; out[idx+1] = ng; out[idx+2] = nb; out[idx+3] = Math.round(pixels[idx+3])
  }
  return out
}

export function applyDithering(pixels, w, h, palette, method, amount, diffusion, serpentine = true) {
  if (!palette || !palette.length) palette = [[0,0,0],[255,255,255]]
  if (method === 'disabled') return noOp(pixels, w, h, palette)
  if (method === 'ordered')  return orderedDither(pixels, w, h, palette, BAYER8, 8, amount, diffusion)
  if (method === 'random')   return randomDither(pixels, w, h, palette, amount, diffusion)
  const kernel = KERNELS[method]
  if (!kernel) return noOp(pixels, w, h, palette)
  return errorDiffuse(pixels, w, h, palette, kernel, amount, diffusion, serpentine)
}
