import { createReadStream } from 'fs'
import { createInterface } from 'readline'

interface Settings {
  filename: string
  debug: boolean
}

const settings: Record<string, Settings> = {
  example1: {
    filename: 'example1.txt',
    debug: false,
  },
  example2: {
    filename: 'example2.txt',
    debug: false,
  },
  example3: {
    filename: 'example3.txt',
    debug: false,
  },
  real: {
    filename: 'input.txt',
    debug: false,
  },
}

class Map {
  private connections: Record<string, string[]> = {}

  add(source, destination) {
    if (!this.connections[source]) this.connections[source] = []
    if (!this.connections[destination]) this.connections[destination] = []

    if (!this.connections[source].includes(destination)) {
      this.connections[source].push(destination)
    }

    if (
      !['start'].includes(source) &&
      !this.connections[destination].includes(source)
    ) {
      this.connections[destination].push(source)
    }
  }

  getConnections(source: string) {
    return this.connections[source]
  }

  print() {
    console.log(this.connections)
  }
}

class PathFinder {
  private _pathCounter = 0
  constructor(private readonly map: Map) {}

  get pathCounter() {
    return this._pathCounter
  }

  resetCounter() {
    this._pathCounter = 0
  }

  static visit(pos, visited = []): { acceptable: boolean; visited: string[] } {
    const newVisited = [...visited]
    if (newVisited.includes(pos))
      return { acceptable: false, visited: newVisited }
    if (/[a-z]/.test(pos)) {
      newVisited.push(pos)
    }
    return { acceptable: true, visited: newVisited }
  }

  walk(pos, { visited = [], jokerUsed = true, path = [] } = {}) {
    if (pos === 'end') {
      this._pathCounter++
      //   console.log(`Reached the end. Path taken: ${path}`)
      return true
    }
    const { acceptable, visited: newVisited } = PathFinder.visit(pos, visited)
    if (acceptable) {
      const newPath = [...path, pos]
      // get possible destinations
      return this.map.getConnections(pos).map(
        (destination) =>
          this.walk(destination, {
            visited: newVisited,
            jokerUsed,
            path: newPath,
          }),
        []
      )
    } else if (pos !== 'start' && !jokerUsed) {
      const newPath = [...path, pos]
      //   console.log(`Using joker on pos ${pos}.`)
      return this.map.getConnections(pos).map(
        (destination) =>
          this.walk(destination, {
            visited: newVisited,
            jokerUsed: true,
            path: newPath,
          }),
        []
      )
    } else {
      //   console.log(`cannot re-visit ${pos}.`)
      return false
    }
  }
}

const run = async (settings: Settings) => {
  const lineReader = createInterface({
    input: createReadStream(`${__dirname}/assets/${settings.filename}`),
  })

  const map = new Map()

  for await (const line of lineReader) {
    const [source, destionation] = line.split('-')
    map.add(source, destionation)
  }

  map.print()

  const walker = new PathFinder(map)
  walker.walk('start')
  console.log(walker.pathCounter)

  console.log(`Walking on sunshine...`)
  walker.resetCounter()
  walker.walk('start', { jokerUsed: false })
  console.log(walker.pathCounter)
}

run(settings.example1)
run(settings.example2)
run(settings.example3)
run(settings.real)
