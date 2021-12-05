import { createReadStream } from 'fs'
import { unzip } from 'lodash'
import { createInterface } from 'readline'

class SquareField {
  private _field: number[][]
  public get field() {
    return this._field
  }

  constructor(length = 10) {
    this._field = new Array(length)
      .fill(0)
      .map(() => new Array(length).fill(0).map(() => 0))
  }

  private drawParallel(x0, x1, y0, y1) {
    if (y0 > y1) {
      ;[y1, y0] = [y0, y1]
    }
    if (x0 > x1) {
      ;[x1, x0] = [x0, x1]
    }
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        this._field[x][y]++
      }
    }
  }

  private drawDiagonal(x0, x1, y0, y1) {
    const xDirection = x1 - x0 >= 0 ? 1 : -1
    const yDirection = y1 - y0 >= 0 ? 1 : -1

    let x = x0,
      y = y0
    while (x !== x1 && y !== y1) {
      this._field[x][y]++
      x += xDirection
      y += yDirection
    }
    this._field[x][y]++
  }

  drawLine(x0, x1, y0, y1) {
    if (x0 === x1 && y0 === y1) {
      console.log('Well...')
    } else if (x0 === x1) {
      //   console.log(x0, y0, x1, y1)
      this.drawParallel(x0, x1, y0, y1)
    } else if (y0 === y1) {
      //   console.log(x0, y0, x1, y1)
      this.drawParallel(x0, x1, y0, y1)
    } else {
      this.drawDiagonal(x0, x1, y0, y1)
    }
  }

  print() {
    console.log(
      unzip(this._field).reduce((accX, x) => {
        return x.reduce((accY, y) => accY + String(y).padStart(3), accX) + '\n'
      }, '')
    )
  }

  count(predicate: ({ x, y, value }) => boolean) {
    return this._field.reduce(
      (accX, row, x) =>
        row.reduce(
          (accY, value, y) => accY + (predicate({ x, y, value }) ? 1 : 0),
          accX
        ),
      0
    )
  }
}

const settings = {
  example: {
    width: 10,
    filename: 'example.txt',
    print: true,
  },
  real: {
    width: 1000,
    filename: 'input.txt',
    print: false,
  },
}

const run = async () => {
  const workWith = settings.real
  const field = new SquareField(workWith.width)

  const lineReader = createInterface({
    input: createReadStream(`${__dirname}/assets/${workWith.filename}`),
  })

  for await (const line of lineReader) {
    const coordinateSet = line.split('->').map((coordinates) =>
      coordinates
        .trim()
        .split(',')
        .map((number) => parseInt(number))
    )

    const [[x0, y0], [x1, y1]] = coordinateSet
    field.drawLine(x0, x1, y0, y1)
  }

  if (workWith.print) {
    field.print()
  }
  console.log(field.count(({ value }) => value > 1))
}

run()
