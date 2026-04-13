import { useState, useEffect } from 'react'

const FAQ = [
  {
    group: 'Getting Started',
    items: [
      {
        q: 'What is Dither Studio?',
        a: 'Dither Studio is a free, browser-based image dithering tool. It converts photos and images into stylised pixel art using classic dithering algorithms — the same techniques used by retro computers, game consoles, and print media. Everything runs locally in your browser; no images are ever uploaded to a server.',
      },
      {
        q: 'How do I load an image?',
        a: 'Three ways: drag and drop an image anywhere on the page, click the drop zone in the Files panel to browse, or press Ctrl+V (Cmd+V on Mac) to paste from clipboard. On mobile, tap the drop zone to open your photo library.',
      },
      {
        q: 'Is my image sent to a server?',
        a: 'No. All processing happens entirely inside your browser using Web Workers. Your images never leave your device.',
      },
    ],
  },
  {
    group: 'Dithering',
    items: [
      {
        q: 'What dithering methods are available?',
        a: 'Dither Studio includes 11 algorithms: Floyd–Steinberg, Jarvis–Judice–Ninke, Stucki, Atkinson, Burkes, Sierra, Sierra 2-Row, Sierra Lite (all error-diffusion), Ordered/Bayer (pattern-based), Random, and None (straight quantisation without dithering).',
      },
      {
        q: 'What is the difference between error-diffusion and ordered dithering?',
        a: 'Error-diffusion methods (Floyd–Steinberg, Atkinson, etc.) spread quantisation error to neighbouring pixels, producing organic and irregular patterns that look natural on photos. Ordered/Bayer dithering uses a fixed geometric grid, giving a structured, halftone-like appearance. Random dithering adds pure noise — gritty and unpredictable.',
      },
      {
        q: 'What does Serpentine Scan do?',
        a: 'When enabled, error-diffusion scans alternate rows left-to-right and right-to-left. This reduces directional "grain" streaks that can appear when scanning left-to-right only on every row.',
      },
      {
        q: 'What is Dot Size?',
        a: 'Dot Size (1–16) downscales the image before dithering, then stretches it back up with pixel-perfect rendering. Higher values produce large, chunky pixels — useful for achieving a lo-fi, low-resolution look similar to old handheld consoles.',
      },
      {
        q: 'What do Amount and Diffusion control?',
        a: 'Amount scales the error that gets spread to neighbours — lower values produce subtler, smoother dithering. Diffusion controls how far the error travels; higher values can create more contrast and "pop" at the cost of a noisier result.',
      },
    ],
  },
  {
    group: 'Palette',
    items: [
      {
        q: 'How does colour quantisation work?',
        a: 'Dither Studio reduces your image to a limited palette before dithering. Three automatic methods are available: Median Cut (fast, good general purpose), Octree (great for images with many distinct colours), and K-Means (slower but often produces the most perceptually accurate palettes).',
      },
      {
        q: 'Can I use my own colours?',
        a: 'Yes. Switch the Quantisation Method to Custom in the Palette panel, then click any swatch to edit it, right-click to remove it, or use Add Colour to grow the palette. You can also click any of the 30+ built-in presets (GameBoy, Pico-8, Nord, Dracula, etc.) to load them instantly.',
      },
      {
        q: 'What does Randomize Palette do?',
        a: 'It picks one of the 30+ built-in palettes at random and applies it as your custom palette — great for quick exploration.',
      },
    ],
  },
  {
    group: 'Adjustments',
    items: [
      {
        q: 'What adjustments are applied before dithering?',
        a: 'The Adjustments panel lets you tune Gamma, Blacks, Whites, Contrast, Saturation, and Hue. There is also a Noise generator (coverage, intensity, saturation) and a Blur/Sharpen pass with controllable edge strength and number of passes. All adjustments are non-destructive — they are applied to a copy of your original image.',
      },
      {
        q: 'How do I reset a slider to its default?',
        a: 'Double-click the label or the value number on any slider to reset it to its default. A small orange dot appears on the label whenever a slider is not at its default value.',
      },
      {
        q: 'Can I type an exact value into a slider?',
        a: 'Yes — single-click the value number on any slider to enter a text input. Type the value you want and press Enter (or click away) to confirm.',
      },
    ],
  },
  {
    group: 'Crop & Size',
    items: [
      {
        q: 'How do I crop my image?',
        a: 'Open the Files panel and click Open Crop Tool. Drag to draw a new crop region, drag the handles to resize, or drag inside the box to reposition. Use the aspect ratio buttons (1:1, 4:3, 16:9, etc.) to snap to a preset ratio. Click Apply Crop to confirm.',
      },
      {
        q: 'What does resizing in the Size section do?',
        a: 'The Width and Height sliders control the output resolution — the size of the dithered image that gets processed and exported. Use Lock to maintain the original aspect ratio, or Free to set arbitrary dimensions.',
      },
    ],
  },
  {
    group: 'Exporting',
    items: [
      {
        q: 'What export formats are supported?',
        a: 'PNG (lossless, best for pixel art and sharp edges), JPEG (smaller files, good for photos), and WebP (modern format, small files with good quality). JPEG and WebP have an adjustable Quality slider.',
      },
      {
        q: 'How do I save my image?',
        a: 'Click the Save button in the Files panel or press Ctrl+S (Cmd+S on Mac). In Chrome and Edge a native OS save dialog will appear. In other browsers the file downloads automatically. Files are named ditherstudioXXXXX.ext with a random 5-digit number.',
      },
      {
        q: 'How do I copy the image to clipboard?',
        a: 'Click the Copy button in the Files panel. The dithered image is copied as a PNG and can be pasted directly into other apps. Clipboard access must be allowed in your browser settings.',
      },
    ],
  },
  {
    group: 'Comparing & Previewing',
    items: [
      {
        q: 'How do I compare the original and dithered versions?',
        a: 'Two modes are available in the bottom bar. Split Compare adds a draggable divider — original on the left, dithered on the right. Hold to Compare shows the pre-dither adjusted image while held and snaps back on release. Press Space to toggle Split Compare.',
      },
      {
        q: 'What is the Live Preview thumbnail?',
        a: 'While dragging a slider, a small thumbnail appears in the corner showing a quick low-resolution preview of the result. This lets you see the effect in real time without waiting for the full-resolution render to complete.',
      },
    ],
  },
  {
    group: 'Keyboard Shortcuts',
    items: [
      {
        q: 'What keyboard shortcuts are available?',
        a: (
          <table className="faq-shortcuts">
            <tbody>
              {[
                ['1 – 5',          'Switch panel (Files, Dither, Palette, Adjustments, Presets)'],
                ['[ / ]',          'Cycle dither method backward / forward'],
                ['Space',          'Toggle Split Compare'],
                ['Ctrl+Z',         'Undo'],
                ['Ctrl+Y / Ctrl+Shift+Z', 'Redo'],
                ['Ctrl+S',         'Save image'],
                ['Ctrl+V',         'Paste image from clipboard'],
                ['Scroll wheel',   'Zoom in / out on canvas'],
                ['Double-click canvas', 'Reset zoom & pan to 100%'],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td><kbd>{k}</kbd></td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ),
      },
    ],
  },
  {
    group: 'Presets & History',
    items: [
      {
        q: 'How do presets work?',
        a: 'Presets save your entire current configuration — dither method, palette, adjustments — under a name. The Presets panel includes 17 built-in starting points across four categories (Print & Press, Retro & Games, Photography & Film, Artistic). You can save your own and delete them individually.',
      },
      {
        q: 'Does Dither Studio support undo/redo?',
        a: 'Yes. Up to 60 steps of undo history are kept per session using Ctrl+Z / Ctrl+Y. History tracks all settings changes but not image loads — loading a new image starts a fresh history.',
      },
      {
        q: 'What is the Gallery?',
        a: 'Every time you save an image, a thumbnail is added to the Gallery in the Files panel (up to 9 images). Click a thumbnail to reload that image and continue editing, or hover and click ✕ to remove it.',
      },
    ],
  },
]

export default function FAQModal({ onClose }) {
  const [openItems, setOpenItems] = useState({})

  const toggle = (key) => setOpenItems(o => ({ ...o, [key]: !o[key] }))

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="faq-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="faq-modal">
        <div className="faq-modal-header">
          <span className="faq-modal-title">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="7" cy="7" r="6"/>
              <path d="M5.5 5.5a1.5 1.5 0 0 1 3 .5c0 1-1.5 1.5-1.5 2.5"/>
              <circle cx="7" cy="11" r="0.5" fill="currentColor" stroke="none"/>
            </svg>
            FAQ
          </span>
          <span className="faq-modal-sub">Frequently asked questions about Dither Studio</span>
          <button className="crop-close-btn" onClick={onClose} title="Close (Esc)">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 2l8 8M10 2l-8 8"/></svg>
          </button>
        </div>

        <div className="faq-modal-body">
          {FAQ.map(group => (
            <div key={group.group} className="faq-group">
              <div className="faq-group-label">{group.group}</div>
              {group.items.map((item, i) => {
                const key = `${group.group}-${i}`
                const isOpen = !!openItems[key]
                return (
                  <div key={key} className={`faq-item${isOpen ? ' faq-item--open' : ''}`}>
                    <button className="faq-question" onClick={() => toggle(key)}>
                      <span>{item.q}</span>
                      <svg
                        className="faq-chevron"
                        viewBox="0 0 10 10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }}
                      >
                        <path d="M2 3.5l3 3 3-3"/>
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="faq-answer">{item.a}</div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}

          <div className="faq-footer">
            Built by <a href="https://estructura.studio/" target="_blank" rel="noopener noreferrer">Estructura Studio</a>
          </div>
        </div>
      </div>
    </div>
  )
}
