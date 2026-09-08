/**
 * Generate pixels for the grid.
 *
 * To run, copy paste into browser's console.
 *
 * By default, letters are 8x8 (6x6 with 1px padding).
 * They can only be scaled up (1x, 2x, 3x, etc.).
 *
 * Two renderers, same glyphs:
 *   - pixelateText() emits CSS background layers, one per lit pixel.
 *   - pixelatePath()  emits a single SVG path, lit pixels merged into
 *     rectangles. Roughly 20x smaller and resolution independent, which is
 *     what the index uses.
 */

const LETTER_SIZE = 8

const letters = {
  'A': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'B': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'C': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'D': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'E': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'F': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'G': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 1, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'H': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'I': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'J': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 1, 0],
    [0, 1, 1, 0, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'K': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 1, 1, 0, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 0, 1, 1, 1, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'L': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'M': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 0, 1, 0, 1, 0],
    [0, 1, 1, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'N': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 0, 1, 1, 1, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'O': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'P': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 0, 1, 1, 1, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'Q': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'R': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 0, 1, 1, 1, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 0, 1, 1, 1, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'S': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'T': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'U': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 1, 0],
    [0, 1, 1, 0, 0, 0, 1, 0],
    [0, 1, 1, 0, 0, 0, 1, 0],
    [0, 1, 1, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'V': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'W': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 1, 0, 1, 0],
    [0, 1, 1, 0, 1, 0, 1, 0],
    [0, 1, 1, 0, 1, 0, 1, 0],
    [0, 1, 1, 0, 1, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'X': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'Y': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  'Z': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  '0': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  '1': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  '2': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  '3': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 0],
    [0, 1, 1, 0, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  '4': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 0, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  '5': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 0],
    [0, 1, 1, 0, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  '6': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  '7': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 1, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  '8': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  '9': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  '.': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  ',': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  "'": [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  '-': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  '/': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 1, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  ':': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  '?': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  '!': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  '>': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  '@': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 1, 1, 0, 1, 0],
    [0, 1, 0, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  ' ': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
}
const modifiers = {
  '.': [
    {
      desc: 'A period surrounded by two words, eg. hello@taktek.io',
      pattern: new RegExp(`\\w\\.\\w`),
      window: [-1, 2],
      matrix: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
      ]
    }
  ]
}

/**
 * Convert a matrix to pixels.
 *
 * @param {number[][]} matrix
 * @param {Object} options
 * @param {number} options.x
 * @param {number} options.y
 * @param {number} options.pixelSize
 * @param {number} options.scale
 */
function pixelateMatrix(matrix, options) {
  // Merge the options with the defaults.
  const opts = normalizeOptions(options, {
    x: 0,
    y: 0,
    pixelSize: 1,
    scale: 1,
  })

  // Initialize the coordinates.
  const coords = {
    x: opts.x * opts.pixelSize,
    y: opts.y * opts.pixelSize
  }

  const pixels = []
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      // If the pixel is transparent, skip it.
      if (matrix[y][x] === 0) {
        // Update the coordinates to the next column.
        coords.x += opts.pixelSize * opts.scale
        continue
      }

      // We don't want to scale the pixel.
      // So add pixels to match the expected scale.
      for (let i = 0; i < opts.scale; i++) {
        for (let j = 0; j < opts.scale; j++) {
          pixels.push(
            `linear-gradient(#000) ${coords.x + (i * opts.pixelSize)}px ${coords.y + (j * opts.pixelSize)}px / ${opts.pixelSize}px ${opts.pixelSize}px no-repeat`
          )
        }
      }

      // Update the coordinates to the next column.
      coords.x += opts.pixelSize * opts.scale
    }

    // Reset the coordinates to the first column.
    coords.x = opts.x * opts.pixelSize
    // Update the coordinates to the next row.
    coords.y += opts.pixelSize * opts.scale
  }

  return pixels
}

/**
 * Resolve a letter to its matrix, applying any modifier the context triggers.
 *
 * @param {string} letter
 * @param {Object} context
 * @param {string} context.text
 * @param {number} context.index
 */
function letterMatrix(letter, context) {
  const l = letter.toUpperCase()

  // Check if the letter is not supported.
  if (!letters[l]) {
    throw new Error(`Unsupported letter: ${l}`)
  }

  // If there are no modifiers, return the original letter.
  if (!modifiers[l]) {
    return letters[l]
  }

  // Check if the context matches any modifier.
  for (const modifier of modifiers[l]) {
    // Get the context window.
    const ctx = context.text.slice(context.index + modifier.window[0], context.index + modifier.window[1])

    // Check if the window matches the modifier pattern.
    if (modifier.pattern.test(ctx)) {
      return modifier.matrix
    }
  }

  // If no modifier matches, return the original letter.
  return letters[l]
}

/**
 * Convert a letter into pixels.
 *
 * @param {string} letter
 * @param {Object} context
 * @param {string} context.text
 * @param {number} context.index
 * @param {Object} options
 * @param {number} options.x
 * @param {number} options.y
 * @param {number} options.pixelSize
 * @param {number} options.scale
 */
function pixelateLetter(letter, context, options) {
  return pixelateMatrix(letterMatrix(letter, context), options)
}

/**
 * Convert a text into pixels.
 *
 * @param {Object[]} lines
 * @param {string} lines[].text
 * @param {number} lines[].scale
 * @param {Object} options
 * @param {number} options.x
 * @param {number} options.y
 * @param {number} options.pixelSize
 */
function pixelateText(lines, options) {
  // Merge the options with the defaults.
  const opts = normalizeOptions(options, {
    x: 0,
    y: 0,
    pixelSize: 1,
  })

  // Initialize the coordinates.
  const coords = {
    x: opts.x,
    y: opts.y
  }

  let pixels = []
  for (const line of lines) {
    // Draw the letters in the line.
    for (let i = 0; i < line.text.length; i++) {
      const letter = line.text[i]

      pixels = pixels.concat(
        ...pixelateLetter(
          letter,
          {
            text: line.text,
            index: i,
          },
          {
            x: coords.x,
            y: coords.y,
            pixelSize: opts.pixelSize,
            scale: line.scale,
          }
        )
      )

      // Update the coordinates to the next column.
      coords.x += LETTER_SIZE * line.scale
    }

    // Reset the coordinates to the first column.
    coords.x = opts.x
    // Update the coordinates to the next row.
    coords.y += LETTER_SIZE * line.scale
  }

  return pixels.filter(Boolean)
}

/** Merges the options with the defaults. */
function normalizeOptions(options, defaults) {
  return {
    ...defaults,
    ...options,
  }
}

/**
 * Convert a text into a single SVG path.
 *
 * Same glyphs as pixelateText, but the lit pixels are merged into the fewest
 * rectangles that cover them, which is roughly 20x less markup than one CSS
 * layer per pixel — and it scales without going blurry. Coordinates are in
 * grid units, one unit per pixel of the 8x8 letter, so the caller decides the
 * real size through the viewBox.
 *
 * @param {Object[]} lines
 * @param {string} lines[].text
 * @param {number} lines[].scale
 * @param {Object} options
 * @param {number} options.x
 * @param {number} options.y
 */
function pixelatePath(lines, options) {
  // Merge the options with the defaults.
  const opts = normalizeOptions(options, {
    x: 0,
    y: 0,
  })

  // Initialize the coordinates.
  const coords = {
    x: opts.x,
    y: opts.y
  }

  const lit = new Set()
  let width = opts.x

  for (const line of lines) {
    // Draw the letters in the line.
    for (let i = 0; i < line.text.length; i++) {
      const matrix = letterMatrix(line.text[i], { text: line.text, index: i })

      for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
          // If the pixel is transparent, skip it.
          if (matrix[y][x] === 0) {
            continue
          }

          // We don't want to scale the pixel.
          // So add pixels to match the expected scale.
          for (let j = 0; j < line.scale; j++) {
            for (let k = 0; k < line.scale; k++) {
              lit.add(`${coords.x + (x * line.scale) + j},${coords.y + (y * line.scale) + k}`)
            }
          }
        }
      }

      // Update the coordinates to the next column.
      coords.x += LETTER_SIZE * line.scale
    }

    // The widest line decides the box.
    width = Math.max(width, coords.x)

    // Reset the coordinates to the first column.
    coords.x = opts.x
    // Update the coordinates to the next row.
    coords.y += LETTER_SIZE * line.scale
  }

  return {
    d: mergeRects(lit),
    width,
    height: coords.y
  }
}

/**
 * Cover the lit pixels with as few rectangles as possible.
 *
 * Greedy, and good enough: take the widest unclaimed run on a row, then grow it
 * downwards for as long as every row below repeats that exact run.
 *
 * @param {Set<string>} lit — cells as "x,y"
 */
function mergeRects(lit) {
  if (lit.size === 0) {
    return ""
  }

  const cells = [...lit].map((key) => key.split(",").map(Number))
  const maxX = Math.max(...cells.map(([x]) => x))
  const maxY = Math.max(...cells.map(([, y]) => y))

  const claimed = new Set()
  const free = (x, y) => lit.has(`${x},${y}`) && !claimed.has(`${x},${y}`)

  let d = ""
  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x <= maxX; x++) {
      if (!free(x, y)) {
        continue
      }

      // Widen while the run continues.
      let width = 1
      while (free(x + width, y)) width++

      // Deepen while the row below repeats the whole run.
      let height = 1
      while (repeats(free, x, y + height, width)) height++

      for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
          claimed.add(`${x + i},${y + j}`)
        }
      }

      d += `M${x} ${y}h${width}v${height}h-${width}z`
    }
  }

  return d
}

/** Whether a run of the given width is free at this row. */
function repeats(free, x, y, width) {
  for (let i = 0; i < width; i++) {
    if (!free(x + i, y)) {
      return false
    }
  }

  return true
}
