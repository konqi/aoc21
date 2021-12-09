import { createReadStream } from 'fs'
import { chain } from 'lodash'
import { createInterface } from 'readline'

interface Settings {
  filename: string
  debug: boolean
}

const settings: Record<string, Settings> = {
  example: {
    filename: 'example.txt',
    debug: true,
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

const sum = (matrix: number[][]) =>
  matrix.reduce(
    (xAcc, row) => xAcc + row.reduce((yAcc, value) => yAcc + value, 0),
    0
  )

const apply = <T = number>(
  matrix: number[][],
  cb: (x: number, y: number, value: number) => T
) => matrix.map((row, x) => row.map((value, y) => cb(x, y, value)))

const findNeighbourCreator = (matrix: number[][]) => {
  const taken: boolean[][] = new Array(matrix.length)
    .fill(0)
    .map(() => new Array(matrix[0].length).fill(0).map(() => false))

  const walk = (x: number, y: number) => {
    const value = get(matrix, x, y, 0)
    if (value && !taken[x][y]) {
      taken[x][y] = true
      return (
        value +
        walk(x - 1, y) +
        walk(x + 1, y) +
        walk(x, y - 1) +
        walk(x, y + 1)
      )
    }

    return value && !taken[x][y] ? value : 0
  }

  return walk
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
  const riskLevel = apply(input, (x, y, value) => {
    if (
      value < get(input, x - 1, y, 9) &&
      value < get(input, x + 1, y, 9) &&
      value < get(input, x, y - 1, 9) &&
      value < get(input, x, y + 1, 9)
    ) {
      return value + 1
    } else {
      return 0
    }
  })

  if (settings.debug) console.log(prettier(riskLevel))
  console.log({ sumOfRiskLevel: sum(riskLevel) })

  // Part B
  const basins = apply(input, (x, y, value) => (value < 9 ? 1 : 0))
  if (settings.debug) console.log(prettier(basins, 0, ''))

  // this would be the mathematical correct calculation of differentials
  //   const correctBasisn = apply(input, (x, y, value) =>
  //     value < get(input, x + 1, y, 9) ||
  //     value < get(input, x - 1, y, 9) ||
  //     value < get(input, x, y - 1, 9) ||
  //     value < get(input, x, y + 1, 9)
  //       ? '█'
  //       : ' '
  //   )
  //  if (settings.debug) console.log(prettier(correctBasisn, 0, ''))

  const neighbourFinder = findNeighbourCreator(basins)
  const valleys = apply(basins, (x, y) => neighbourFinder(x, y))

  if (settings.debug) console.log(prettier(valleys, 3, ''))

  console.log({
    neighbourProduct: chain(valleys)
      .flatten()
      .orderBy()
      .slice(-3)
      .tap((highestNeighbourCounts) => console.log({ highestNeighbourCounts }))
      .reduce((acc, value) => acc * value, 1)
      .value(),
  })
}

run(settings.example)
run(settings.real)
