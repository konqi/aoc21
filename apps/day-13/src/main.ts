import { createReadStream } from 'fs'
import { unzip } from 'lodash'
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
  realAlt: {
    filename: 'inputAlternative.txt',
    debug: false,
  },
}

const foldInputRegex = /^fold along ([xy])=([0-9]*)$/

class Paper<T> {
  plane: T[][] = []
  dimensions = { x: 0, y: 0 }

  constructor(private readonly defaultValue: T) {}

  updateDimensions(x, y) {
    if (x > this.dimensions.x) this.dimensions.x = x
    if (y > this.dimensions.y) this.dimensions.y = y
  }

  put(x: number, y: number, value: T) {
    this.updateDimensions(x, y)
    if (!this.plane[x]) {
      this.plane[x] = []
    }

    this.plane[x][y] = value
  }

  private prettier<T = number>(matrix: T[][], pad = 2, separator = ',') {
    return matrix
      .map((row) =>
        row.map((value) => String(value).padStart(pad)).join(separator)
      )
      .join('\n')
  }

  private rotate() {
    this.plane = unzip(this.plane)
    this.dimensions = { x: this.dimensions.y, y: this.dimensions.x }
  }

  foldX(pos: number) {
    this.rotate()
    this.foldY(pos)
    this.rotate()
  }

  foldY(pos: number) {
    for (let x = 0; x <= this.dimensions.x; x++) {
      for (let y = pos + 1; y <= this.dimensions.y; y++) {
        const value = this.plane[x][y]
        if (value !== this.defaultValue) {
          this.plane[x][this.dimensions.y - y] = value
        }
      }
    }

    this.plane = this.plane.map((x) => x.slice(0, pos))
    this.dimensions.y = pos - 1
  }

  sum() {
    return this.plane.reduce(
      (accX, col) =>
        col.reduce(
          (accY, row) => accY + (row !== this.defaultValue ? 1 : 0),
          accX
        ),
      0
    )
  }

  finish() {
    this.dimensions.y += this.dimensions.y % 2
    for (let x = 0; x <= this.dimensions.x; x++) {
      this.plane[x] = this.plane[x] ?? []
      for (let y = 0; y <= this.dimensions.y; y++) {
        this.plane[x][y] = (this.plane[x] ?? [])[y] ?? this.defaultValue
      }
    }
  }

  print() {
    console.log(this.prettier(unzip(this.plane), 1, ''))
  }
}

const run = async (settings: Settings) => {
  const lineReader = createInterface({
    input: createReadStream(`${__dirname}/assets/${settings.filename}`),
  })

  let stage = 0
  const paper = new Paper('.')

  for await (const line of lineReader) {
    const trimmedLine = line.trim()
    if (trimmedLine.length === 0) {
      stage++
      paper.finish()
      continue
    }

    if (stage === 0) {
      const [x, y] = line.split(',').map(Number)
      paper.put(x, y, '█')
    } else if (stage === 1) {
      // fold along y=7
      const [, axis, pos] = line.match(foldInputRegex)
      if (axis === 'y') paper.foldY(Number(pos))
      else if (axis === 'x') paper.foldX(Number(pos))

      console.log({ sum: paper.sum() })
    }
  }

  console.log(paper.print())
}

run(settings.example)
run(settings.real)
run(settings.realAlt)
