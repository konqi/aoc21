import { createReadStream } from 'fs'
import { flatten, unzip } from 'lodash'
import { createInterface } from 'readline'

interface Settings {
  filename: string
  revolutions: number
}

const settings: Record<string, Settings> = {
  example: {
    filename: 'example.txt',
    revolutions: 10,
  },
  real: {
    filename: 'input.txt',
    revolutions: 10,
  },
}

function createMatrix(n: number, m: number = n, defaultValue = undefined) {
  return new Array(n)
    .fill(undefined)
    .map(() => new Array(m).fill(undefined).map(() => defaultValue))
}

type Coordinate = [x: number, y: number]
class Node {
  neighbors: { node: Node; distance: number }[] = []
  tentativeDistance = Infinity
  visited = false
  previous: Node = undefined
}

class Map {
  private map: number[][] = []
  private graphMatrix: Node[][]

  get dimensions(): Coordinate {
    return [this.map.length - 1, this.map.length - 1]
  }

  addRow(cols: number[]) {
    this.map.push(cols)
  }

  print() {
    console.log(this.map.map((row) => row.join('')).join('\n'))
  }

  printDistances() {
    console.log(
      this.graphMatrix
        .map((row) =>
          row
            .map((value) => String(value.tentativeDistance).padStart(9))
            .join('')
        )
        .join('\n')
    )
  }

  toGraph() {
    this.graphMatrix = createMatrix(this.map.length).map((col) =>
      col.map(() => new Node())
    )

    const getStuff = (x, y) => {
      if (x < 0 || y < 0) return undefined
      if (x < this.map.length && y < this.map.length) {
        const distance = this.map[x][y]
        const node = this.graphMatrix[x][y]

        return { distance, node }
      }
    }

    for (let x = 0; x < this.map.length; x++) {
      for (let y = 0; y < this.map.length; y++) {
        const currentNode = this.graphMatrix[x][y]
        const neighbors = [
          getStuff(x, y + 1),
          getStuff(x, y - 1),
          getStuff(x + 1, y),
          getStuff(x - 1, y),
        ]
        neighbors.forEach((neighbor) => {
          if (neighbor) {
            currentNode.neighbors.push(neighbor)
          }
        })
      }
    }
  }

  findPath(from: Coordinate, to: Coordinate) {
    const unvisited = flatten(this.graphMatrix)
    let current = this.graphMatrix[from[0]][from[1]]
    current.tentativeDistance = 0

    do {
      current.neighbors.forEach(({ distance, node }) => {
        const distanceToThisNode = current.tentativeDistance + distance
        if (distanceToThisNode < node.tentativeDistance) {
          node.tentativeDistance = distanceToThisNode
          node.previous = current
        }
      })

      current.visited = true
      const currentIndex = unvisited.indexOf(current)
      unvisited.splice(currentIndex, 1)

      const neigborsOrderedByTentativeDistance = unvisited.sort(
        (a, b) =>
          (a.visited ? Infinity : a.tentativeDistance) -
          (b.visited ? Infinity : b.tentativeDistance)
      )

      current = neigborsOrderedByTentativeDistance[0]
      if (unvisited.length % 1000 === 0) {
        console.log(`${new Date().toLocaleTimeString()} ${unvisited.length}`)
      }
    } while (unvisited.length > 0)

    return this.graphMatrix[to[0]][to[1]].tentativeDistance
    // while(runner.previous !== undefined){
    //     runner = runner.previous
    // }
  }
}

function plus(val: number[], incBy: number) {
  return val.map((value) => {
    for (let i = incBy; i--; i > 0) {
      value++
      if (value > 9) value = 1
    }
    return value
  })
}

const run = async (settings: Settings) => {
  const lineReader = createInterface({
    input: createReadStream(`${__dirname}/assets/${settings.filename}`),
  })

  const tmpMap = []
  for await (const line of lineReader) {
    tmpMap.push(line.split('').map(Number))
  }

  let bigMap = tmpMap.map((row) => [
    ...plus(row, 0),
    ...plus(row, 1),
    ...plus(row, 2),
    ...plus(row, 3),
    ...plus(row, 4),
  ])

  bigMap = unzip(
    unzip(bigMap).map((row) => [
      ...row,
      ...plus(row, 1),
      ...plus(row, 2),
      ...plus(row, 3),
      ...plus(row, 4),
    ])
  )

  const map = new Map()
  tmpMap.forEach((row) => map.addRow(row))
  map.toGraph()

  //   big.print()

  console.log('Regular findPath:', map.findPath([0, 0], map.dimensions))
  //   map.print()
  //   map.printDistances()

  const big = new Map()
  bigMap.forEach((row) => big.addRow(row))
  big.toGraph()
  console.log('Graph built')
  console.log('Big findPath:', big.findPath([0, 0], big.dimensions))

  console.log('END')
}

run(settings.example)
run(settings.real)
