/**
 * Generate pixels for the grid.
 *
 * To run, copy paste into browser's console.
 *
 * By default, letters are 8x8 (6x6 with 1px padding).
 * They can only be scaled up (1x, 2x, 3x, etc.).
 * Not all letters are supported yet.
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
  ]
}

/**
 * Convert a letter to pixels.
 *
 * @param {string} letter
 * @param {Object} options
 * @param {number} options.x
 * @param {number} options.y
 * @param {number} options.pixelSize
 * @param {number} options.scale
 */
function pixelateLetter(letter, options) {
  // Convert the letter to uppercase.
  const l = letter.toUpperCase()

  // Merge the options with the defaults.
  const opts = normalizeOptions(options, {
    x: 0,
    y: 0,
    pixelSize: 1,
    scale: 1,
  })

  // Check if the letter is supported.
  if (!letters[l]) {
    throw new Error(`Unsupported letter: ${l}`)
  }

  // Get the matrix of the letter.
  const matrix = letters[l]

  // Initialize the coordinates.
  const coords = {
    x: opts.x * opts.pixelSize,
    y: opts.y * opts.pixelSize
  }

  const pixels = []
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x]) {
        pixels.push(
          `linear-gradient(#000) ${coords.x}px ${coords.y}px / ${opts.pixelSize * opts.scale}px ${opts.pixelSize * opts.scale}px no-repeat`
        )
      }

      // Update the coordinates to the next column.
      coords.x += opts.pixelSize * opts.scale
    }

    // Reset the coordinates to the first column.
    coords.x = opts.x * opts.pixelSize
    // Update the coordinates to the next row.
    coords.y += opts.pixelSize * opts.scale
  }

  return pixels.join(",")
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

  const pixels = []
  for (const line of lines) {
    // Draw the letters in the line.
    for (const letter of line.text) {
      pixels.push(
        pixelateLetter(letter, {
          x: coords.x,
          y: coords.y,
          pixelSize: opts.pixelSize,
          scale: line.scale,
        })
      )

      // Update the coordinates to the next column.
      coords.x += LETTER_SIZE * line.scale
    }

    // Reset the coordinates to the first column.
    coords.x = opts.x
    // Update the coordinates to the next row.
    coords.y += LETTER_SIZE * line.scale
  }

  return pixels.filter(Boolean).join(",")
}

/** Merges the options with the defaults. */
function normalizeOptions(options, defaults) {
  return {
    ...defaults,
    ...options,
  }
}
