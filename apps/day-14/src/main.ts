import { createReadStream } from 'fs'
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
  realA: {
    filename: 'input.txt',
    revolutions: 10,
  },
  realB: {
    filename: 'input.txt',
    revolutions: 40,
  },
}

const map: Record<string, string> = {}

const inputRegex = /^([A-Z]*) -> ([A-Z]*)$/

class PairCounter {
  constructor(private readonly map: Record<string, string>) {}

  getSpliceChar = (pair: string) => {
    return this.map[pair]
  }

  toPairs(sequence: string[]) {
    const newPairs: Record<string, number> = {}
    for (let i = 1; i < sequence.length; i++) {
      const pair = `${sequence[i - 1]}${sequence[i]}`
      newPairs[pair] = (newPairs[pair] ?? 0) + 1
    }

    return newPairs
  }

  splicePairs(pairs: Record<string, number>) {
    const newPairs = {}
    Object.keys(pairs).forEach((pair) => {
      const newChar = this.getSpliceChar(pair)
      const pairLeft = pair.charAt(0) + newChar
      const pairRight = newChar + pair.charAt(1)

      const amount = pairs[pair] ?? 1

      newPairs[pairLeft] = (newPairs[pairLeft] ?? 0) + amount
      newPairs[pairRight] = (newPairs[pairRight] ?? 0) + amount
    })

    return newPairs
  }

  pairCountsToCharCounts(pairs: Record<string, number>) {
    const charCounts = {}
    for (const pair of Object.keys(pairs)) {
      const [, right] = pair.split('')
      const number = pairs[pair]

      charCounts[right] = (charCounts[right] ?? 0) + number
    }

    return charCounts
  }
}

const run = async (settings: Settings) => {
  const lineReader = createInterface({
    input: createReadStream(`${__dirname}/assets/${settings.filename}`),
  })

  let stage = 0
  let sequence: string[]

  for await (const line of lineReader) {
    if (line.trim().length === 0) {
      stage++
      continue
    }

    if (stage === 0) {
      sequence = line.split('')
    } else if (stage === 1) {
      const [, from, to] = line.match(inputRegex)
      map[from] = to
    }
  }

  const counter = new PairCounter(map)
  let pairs = counter.toPairs(sequence)
  for (let i = 0; i < settings.revolutions; i++) {
    pairs = counter.splicePairs(pairs)
  }
  const charCounts = counter.pairCountsToCharCounts(pairs)
  charCounts[sequence[0]]++

  const numbers = Object.values(charCounts) as number[]
  const min = Math.min(...numbers)
  const max = Math.max(...numbers)

  console.log({ revolutions: settings.revolutions, result: max - min })
}

run(settings.example)
run(settings.realA)
run(settings.realB)
