import { createReadStream } from 'fs'
import { createInterface } from 'readline'

interface Settings {
  filename: string
}

const settings: Record<string, Settings> = {
  example: {
    filename: 'example.txt',
  },
  real: {
    filename: 'input.txt',
  },
}

type Tuple = [Tuple | number, Tuple | number]

function parseLine(input: string): Tuple {
  return JSON.parse(input)
}

function findAndExplodeSnailfish(input: Tuple): Tuple {
  const tupleAsString = JSON.stringify(input)
  let depth = 0
  let cutStart = -1
  for (const index in tupleAsString.split('')) {
    const char = tupleAsString[index]
    if (char === '[') {
      depth++
      if (depth > 4) {
        cutStart = Number(index)
      }
    } else if (char === ']') {
      depth--
      if (cutStart > 0) {
        const newTupleString = explodePair(
          tupleAsString,
          cutStart,
          Number(index) + 1
        )
        return JSON.parse(newTupleString)
        break
      }
    }
  }

  return input
}

function explodePair(tupleAsString: string, cutStart: number, cutEnd: number) {
  const explodingTuple = JSON.parse(
    tupleAsString.substring(cutStart, Number(cutEnd))
  )
  const explosionString = [
    tupleAsString.substring(0, cutStart),
    '💥',
    tupleAsString.substring(Number(cutEnd)),
  ].join('')

  const [
    ,
    stuffBefore,
    numberBeforeExplosion,
    beforeExplosion,
    afterExplosion,
    numberAfterExplosion,
    stuffAfter,
  ] = explosionString.match(
    /(.*?[^0-9])([0-9]*)([^0-9]*)💥([^0-9]*)([0-9]*)([^0-9].*)/
  )

  //   console.log({
  //     stuffBefore,
  //     numberBeforeExplosion,
  //     beforeExplosion,
  //     afterExplosion,
  //     numberAfterExplosion,
  //     stuffAfter,
  //   })

  const replaceNumberBefore = numberBeforeExplosion
    ? Number(numberBeforeExplosion) + explodingTuple[0]
    : ''
  const replaceNumberAfter = numberAfterExplosion
    ? Number(numberAfterExplosion) + explodingTuple[1]
    : ''

  return [
    stuffBefore,
    replaceNumberBefore,
    beforeExplosion,
    '0',
    afterExplosion,
    replaceNumberAfter,
    stuffAfter,
  ].join('')
}

function findAndSplitSnailfish(input: Tuple): Tuple {
  const tupleAsString = JSON.stringify(input)
  const splitCandidate = tupleAsString.match(/(.*?[^0-9])([0-9]{2})([^0-9].*)/)
  if (splitCandidate) {
    const [, before, toSplit, after] = splitCandidate
    const num = Number(toSplit)
    const replacementTuple = [Math.floor(num / 2), Math.ceil(num / 2)]

    const newTupleString = [
      before,
      JSON.stringify(replacementTuple),
      after,
    ].join('')

    return JSON.parse(newTupleString)
  }

  return input
}

function reduceSnailfish(input: Tuple): Tuple {
  let somethingHappened = true
  while (somethingHappened) {
    somethingHappened = false
    console.log('reduce', JSON.stringify(input))

    // find pair nested in four pairs
    const explodeOutput = findAndExplodeSnailfish(input)
    if (explodeOutput !== input) {
      somethingHappened = true
      input = explodeOutput
      continue
    }

    // find all numbers regular 10
    const splitOutput = findAndSplitSnailfish(input)
    if (splitOutput !== input) {
      somethingHappened = true
      input = splitOutput
      continue
    }
  }

  return input
}

function sumSnailfish(a: Tuple, b: Tuple): Tuple {
  return [a, b]
}

function magniTuple(input: Tuple) {
  let tupleString = JSON.stringify(input)

  let match = tupleString.match(/\[([0-9]+),([0-9]+)\]/)
  while (match !== null) {
    const [all, left, right] = match
    tupleString = tupleString.replace(
      all,
      String(Number(left) * 3 + Number(right) * 2)
    )

    match = tupleString.match(/\[([0-9]+),([0-9]+)\]/)
  }

  return Number(tupleString)
}

const runA = async (settings: Settings) => {
  const lineReader = createInterface({
    input: createReadStream(`${__dirname}/assets/${settings.filename}`),
  })

  let sum = undefined
  for await (const line of lineReader) {
    const snailfishNumber = parseLine(line)
    if (!sum) {
      sum = snailfishNumber
    } else {
      sum = sumSnailfish(sum, snailfishNumber)
      sum = reduceSnailfish(sum)
    }
  }

  console.log(JSON.stringify(sum))

  const magnitude = magniTuple(sum)
  console.log('Magnitude: ', magnitude)
  console.log('END')
}

const runB = async (settings: Settings) => {
  const lineReader = createInterface({
    input: createReadStream(`${__dirname}/assets/${settings.filename}`),
  })

  const lines: Tuple[] = []
  for await (const line of lineReader) {
    lines.push(parseLine(line))
  }

  const sums = []
  for (let i = 0; i < lines.length; i++) {
    for (let j = 0; j < lines.length; j++) {
      sums.push(magniTuple(reduceSnailfish(sumSnailfish(lines[i], lines[j]))))
    }
  }

  console.log('Max magnitude ', Math.max(...sums))

  console.log('END')
}

runA(settings.example)
runA(settings.real)

runB(settings.example)
runB(settings.real)
