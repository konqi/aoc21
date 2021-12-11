import { createReadStream } from 'fs'
import { createInterface } from 'readline'

interface Settings {
  filename: string
  debug: boolean
}

const settings: Record<string, Settings> = {
  example: {
    filename: 'example.txt',
    debug: false,
  },
  real: {
    filename: 'input.txt',
    debug: false,
  },
}

const get = (matrix: number[][], x: number, y: number, defaultValue: number) =>
  (matrix[x] ?? [])[y] ?? defaultValue

const prettier = <T = number>(matrix: T[][], pad = 2, separator = ',') =>
  matrix
    .map((row) =>
      row.map((value) => String(value).padStart(pad)).join(separator)
    )
    .join('\n')

const copy = (matrix: number[][]) =>
  matrix.map((row) => row.map((value) => value))

const apply = <T = number>(
  matrix: number[][],
  cb: (x: number, y: number, value: number, overlay: number[][]) => T
) => {
  const overlay: number[][] = copy(matrix)
  const mapped = matrix.map((row, x) =>
    row.map((value, y) => cb(x, y, value, overlay))
  )
  // merge
  return mapped
}

const run = async (settings: Settings) => {
  const lineReader = createInterface({
    input: createReadStream(`${__dirname}/assets/${settings.filename}`),
  })

  const input: number[][] = []

  for await (const line of lineReader) {
    input.push(line.split('').map(Number))
  }

  // Part A
  let matrixA: number[][] = input
  let flashcount = 0
  for (let step = 0; step < 100; step++) {
    // next step
    matrixA = apply(matrixA, (_x, _y, value) => value + 1)

    // flash phase
    let flashed = true
    while (flashed) {
      flashed = false
      for (let x = 0; x < matrixA.length; x++) {
        for (let y = 0; y < matrixA[0].length; y++) {
          const value = get(matrixA, x, y, 0)
          if (value > 9) {
            matrixA[x][y] = 0
            flashed = true
            flashcount++

            for (let i = x - 1; i <= x + 1; i++) {
              for (let j = y - 1; j <= y + 1; j++) {
                const current = get(matrixA, i, j, 0)
                if (current > 0) {
                  matrixA[i][j]++
                }
              }
            }
          }
        }
      }
    }

    if (settings.debug) console.log(`STEP ${step + 1}`)
    if (settings.debug) console.log(prettier(matrixA))
    if (settings.debug) console.log()
  }
  console.log({ flashcount })

  // Part B
  let matrixB: number[][] = input
  let flashcountB = 0
  let step = 0
  while (flashcountB < matrixB.length * matrixB[0].length) {
    flashcountB = 0
    // next step
    matrixB = apply(matrixB, (_x, _y, value) => value + 1)

    // flash phase
    let flashed = true
    while (flashed) {
      flashed = false
      for (let x = 0; x < matrixB.length; x++) {
        for (let y = 0; y < matrixB[0].length; y++) {
          const value = get(matrixB, x, y, 0)
          if (value > 9) {
            matrixB[x][y] = 0
            flashed = true
            flashcountB++

            for (let i = x - 1; i <= x + 1; i++) {
              for (let j = y - 1; j <= y + 1; j++) {
                const current = get(matrixB, i, j, 0)
                if (current > 0) {
                  matrixB[i][j]++
                }
              }
            }
          }
        }
      }
    }

    step++
  }

  console.log({ step })
}

run(settings.example)
run(settings.real)
