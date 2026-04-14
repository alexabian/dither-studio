# ditherama — Brand Briefing

**Version:** 0.7.13  
**Built by:** Estructura Studio — [estructura.studio](https://estructura.studio/)  
**Live URL:** Deployed via Vercel

---

## What It Is

ditherama is a free, browser-based image dithering tool. It converts photos and images into stylized pixel art using classic dithering algorithms — the same techniques used by retro computers, game consoles, and print media.

Everything runs locally in the browser using Web Workers. No images are uploaded anywhere. No account needed. No server. Files never leave the user's device.

---

## Core Value Proposition

- **Free.** No paywall, no sign-up.
- **Private.** 100% local processing. Nothing leaves the device.
- **Fast.** Web Worker processing with live preview while adjusting sliders.
- **Deep.** 11 dither algorithms, 30+ palette presets, full color adjustment stack.
- **Accessible.** Works in any modern browser. No install.

---

## Target Audience

- Graphic designers and illustrators creating retro or lo-fi aesthetics
- Pixel artists and game developers
- Print designers working with limited-color output (risograph, silkscreen)
- Photographers exploring experimental processing
- Developers and creative coders

---

## Interface Overview

The app is a single-page layout with:

- **Canvas area** — full-resolution live preview with zoom, pan, and split compare
- **Side panel** — 5 tabbed sections (Files, Dither, Palette, Adjustments, Presets)
- **Bottom status bar** — shows dimensions, active palette, dither method, processing time, version
- **Header** — logo, keyboard hints, theme toggle, FAQ, About

Default theme is dark. Light mode available via toggle. Setting persists across sessions.

---

## Feature Breakdown

### Import
- Drag and drop anywhere on the page
- Click to browse files
- Paste from clipboard (Ctrl+V)
- All standard image formats supported

### Dithering — 11 Methods
| Method | Character |
|---|---|
| None | Straight quantization |
| Floyd–Steinberg | Classic, natural-looking |
| Jarvis JN | High-quality, fine detail |
| Stucki | Smooth with detail preservation |
| Atkinson | Compact, light artifacts (default) |
| Burkes | Smooth midtones |
| Sierra | Good color fidelity |
| Sierra 2-Row | Faster Sierra variant |
| Sierra Lite | Lightweight, fast |
| Ordered (Bayer) | Geometric halftone pattern |
| Random | Pure noise, gritty texture |

**Controls:** Amount (0–1), Diffusion (0–2), Dot Size (1–16px), Serpentine Scan toggle.

### Palette — 4 Quantization Methods
- Median Cut (default), Octree, K-Means, Custom
- Colors: 2–64

**30+ built-in palette presets in 4 categories:**

| Category | Presets |
|---|---|
| Monochrome | B&W, Grayscale 4/8, Green Terminal, Amber Terminal, Sepia |
| Retro Consoles | GameBoy, GB Pocket, GB Light, CGA, EGA, Pico-8, C64, ZX Spectrum, MSX, NES, Apple II, Commodore Amiga |
| Modern Themes | Nord, Dracula, Gruvbox, Solarized |
| Artistic | Warm Tones, Cool Blues, Synthwave, Pastel, Risograph, Forest, Sunset, Blueprint |

Custom mode: click any swatch to edit with color picker, right-click to remove, add new colors.

### Adjustments
All non-destructive. Applied to a copy of the original.

**Color:** Gamma, Blacks, Whites, Contrast, Saturation, Hue  
**Noise:** Coverage, Intensity, Saturation  
**Blur/Sharpen:** Blur Strength, Edge Strength, Passes  
**Histogram** displayed at top of panel.

Sliders support: double-click label to reset, click value to type exact number, nudge buttons (±).

### Presets — 17 Built-in + Unlimited Custom
| Category | Presets |
|---|---|
| Print & Press | Newspaper, Silkscreen, Risograph, Blueprint, Engraving |
| Retro & Games | Retro Game, GameBoy, Halftone, Pixel Art |
| Photography & Film | Fine Detail, Lo-Fi, VHS, Sepia Photo |
| Artistic | Synthwave, Woodblock, Comic Book, Night Vision |

Custom presets save the full configuration (method + palette + all adjustments) under a name. Stored in localStorage.

### Export
| Format | Notes |
|---|---|
| PNG | Lossless, best for pixel art |
| JPEG | Smaller files, quality slider (0.1–1.0) |
| WebP | Modern, optimized, quality slider |

Files saved as `ditherstudioXXXXX.ext` (5-digit random suffix).  
Copy to clipboard as PNG also available.

### Crop Tool
Full crop modal with drag handles, aspect ratio presets, and pixel-accurate dimensions.

### Gallery
Stores up to 9 recent saves as thumbnails. Click to reload and continue editing.

### Compare Modes
- **Split Compare:** Draggable divider — original left, dithered right
- **Hold to Compare:** Shows pre-dither image while button is held
- **Live Preview:** Low-res thumbnail while dragging sliders

### Undo / Redo
Up to 60 history steps per session. Tracks all setting changes. Ctrl+Z / Ctrl+Y.

---

## Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| 1–5 | Switch panels |
| [ / ] | Cycle dither method |
| Space | Toggle Split Compare |
| Ctrl+S | Save image |
| Ctrl+V | Paste image |
| Ctrl+Z / Ctrl+Y | Undo / Redo |
| Scroll | Zoom canvas |
| Double-click canvas | Reset zoom |

---

## Visual Identity Notes

**Logo:** A 3×2 grid of squares with varying opacity — represents the dithering concept itself (varying dot density to simulate tonal depth).

**Name:** ditherama. Two words. "Dither" is a technical term (the process) and a verb. "Studio" signals a professional-grade tool.

**Aesthetic:** The app lives at the intersection of retro computing and modern design tools. Dark-first. Monospace details. Dense information layout without feeling overwhelming.

**Palette range:** The built-in presets cover the full spectrum of use cases — from B&W newspaper print to neon Synthwave to earthy Risograph. The visual range is intentionally wide.

**Tone:** Technical but accessible. No subscription. No friction. Builds trust through transparency (everything local, open about what it does).

---

## Technical Notes (for context)

- React 18 + Vite 5 SPA
- Web Workers for off-main-thread image processing
- No backend, no database, no auth
- Deployed on Vercel (static hosting)
- Repository: GitHub (`alexabian/dither-studio`)

---

## Brand Directions to Explore

1. **Retro-technical** — leans into the halftone/pixel aesthetic. Dot grids, limited palettes, bitmap textures.
2. **Modern tool** — clean, minimal, positions alongside Figma/Photoshop as a focused creative utility.
3. **Privacy-first** — leads with the local processing angle. "Your images never leave your screen."
4. **Artist community** — emphasizes the range of output aesthetics. One tool, many visual worlds.
