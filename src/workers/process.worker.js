import { applyAdjustments, resizePixels, computeHistogram } from '../utils/adjustments.js'
import { buildPalette } from '../utils/colorQuant.js'
import { applyDithering } from '../utils/dithering.js'

self.onmessage = ({ data }) => {
  const { id, pixels, origWidth, origHeight, displayWidth, displayHeight, settings, quick } = data

  try {
    let src = pixels, w = origWidth, h = origHeight

    // Resize to display dimensions
    if (displayWidth !== origWidth || displayHeight !== origHeight) {
      src = resizePixels(src, origWidth, origHeight, displayWidth, displayHeight)
      w = displayWidth; h = displayHeight
    }

    // Quick mode: crop center 200×200 for live slider preview
    if (quick) {
      const cw = Math.min(200, w), ch = Math.min(200, h)
      const ox = Math.floor((w - cw) / 2), oy = Math.floor((h - ch) / 2)
      const crop = new Uint8ClampedArray(cw * ch * 4)
      for (let cy = 0; cy < ch; cy++) {
        for (let cx = 0; cx < cw; cx++) {
          const si = ((oy + cy) * w + (ox + cx)) * 4
          const di = (cy * cw + cx) * 4
          crop[di] = src[si]; crop[di+1] = src[si+1]; crop[di+2] = src[si+2]; crop[di+3] = src[si+3]
        }
      }
      src = crop; w = cw; h = ch
    }

    // Adjustments → Float32Array (0-255)
    const adjusted = applyAdjustments(src, w, h, settings)

    // u8 for palette sampling
    const adjU8 = new Uint8ClampedArray(adjusted.length)
    for (let i = 0; i < adjusted.length; i++) adjU8[i] = Math.max(0, Math.min(255, Math.round(adjusted[i])))

    // Build palette
    const palette = buildPalette(adjU8, w, h, settings.paletteMethod, settings.paletteColors, settings.customColors)

    // Dither
    const dithered = applyDithering(adjusted, w, h, palette, settings.ditherMethod, settings.ditherAmount, settings.ditherDiffusion, settings.serpentine !== false)

    // Histogram
    const hist = computeHistogram(dithered, w, h)

    const result = {
      id, quick,
      processedPixels: dithered,
      adjustedPixels: adjU8,
      palette,
      histogram: { r: Array.from(hist.r), g: Array.from(hist.g), b: Array.from(hist.b) },
      width: w, height: h,
    }

    // Transfer buffers to avoid copying
    self.postMessage(result, [dithered.buffer, adjU8.buffer])

  } catch (err) {
    self.postMessage({ id, quick, error: err.message })
  }
}
