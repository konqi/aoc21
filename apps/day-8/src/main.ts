import { createReadStream } from 'fs'
import { difference, invert } from 'lodash'
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

enum SEGMENT {
  T = 'a',
  TL = 'b',
  TR = 'c',
  C = 'd',
  BL = 'e',
  BR = 'f',
  B = 'g',
}

const NUMBERS = {
  abcefg: 0,
  cf: 1,
  acdeg: 2,
  acdfg: 3,
  bcdf: 4,
  abdfg: 5,
  abdefg: 6,
  acf: 7,
  abcdefg: 8,
  abcdfg: 9,
}

const decodeInput = (input: string) => {
  const solution: Record<SEGMENT, undefined | string> = {
    [SEGMENT.T]: undefined,
    [SEGMENT.TL]: undefined,
    [SEGMENT.TR]: undefined,
    [SEGMENT.C]: undefined,
    [SEGMENT.BL]: undefined,
    [SEGMENT.BR]: undefined,
    [SEGMENT.B]: undefined,
  }
  const inputs = input.split(' ')

  let one, four, seven, eight

  const inputSegments = inputs.map((code) => {
    const segments = code.split('')
    if (segments.length === 2) {
      one = segments
    } else if (segments.length === 3) {
      seven = segments
    } else if (segments.length === 4) {
      four = segments
    } else if (segments.length === 7) {
      eight = segments
    }

    return segments
  })

  const sixSegmentCandidates = inputSegments.filter(
    (candidate) => candidate.length === 6
  )

  // the different segment between 7 and 1 must be the top segment
  solution[SEGMENT.T] = difference<string>(seven, one)[0]
  // four plus the top segment is almost 9, and it can only differ by one, whereas 0 and 6 would differ by two
  const nine = sixSegmentCandidates.find(
    (candidate) =>
      difference(candidate, [...four, solution[SEGMENT.T]]).length === 1
  )
  sixSegmentCandidates.splice(sixSegmentCandidates.indexOf(nine), 1)

  // the different segment between 0 and 8 is in the left bottom segment
  solution[SEGMENT.BL] = difference(eight, nine)[0]
  // the different segment between 0 and (4 + top) is the bottom segment
  solution[SEGMENT.B] = difference(nine, [...four, solution[SEGMENT.T]])[0]

  // from 8 to zero, must be the letter missing that is not part of 1 -> center
  const zero = sixSegmentCandidates.filter(
    (candidate) => candidate.includes(one[0]) && candidate.includes(one[1])
  )[0]
  sixSegmentCandidates.splice(sixSegmentCandidates.indexOf(zero), 1)

  // the center element is the difference between eight and zero
  solution[SEGMENT.C] = difference(eight, zero)[0]

  const six = sixSegmentCandidates[0]

  // top right is the missing segment, between 8 and 6
  solution[SEGMENT.TR] = difference(eight, six)[0]
  // bottom right must be the other segment when top right is removed
  solution[SEGMENT.BR] = one.filter(
    (segment) => segment !== solution[SEGMENT.TR]
  )[0]
  // four without the known center, top-right and bottom right must be top left
  solution[SEGMENT.TL] = four.filter(
    (segment) =>
      ![
        solution[SEGMENT.C],
        solution[SEGMENT.TR],
        solution[SEGMENT.BR],
      ].includes(segment)
  )[0]

  return solution
}

const decodeOutput = (
  encoder: Record<SEGMENT, undefined | string>,
  value: string[]
) => {
  const decoder = invert(encoder)
  const decoded = value.map((segment) => decoder[segment]).sort()

  return NUMBERS[decoded.join('')]
}

const run = async (settings: Settings) => {
  const lineReader = createInterface({
    input: createReadStream(`${__dirname}/assets/${settings.filename}`),
  })

  const numberCounts = new Array(10).fill(0).map(() => 0)

  let sumOfAllDecodedOutputs = 0
  for await (const line of lineReader) {
    const [input, output] = line.split(/ +\| +/)

    const encoder = decodeInput(input)

    const outputs = output.split(' ')

    outputs.forEach((code) => {
      numberCounts[code.length]++
    })

    const decodedOutput = outputs.reduce(
      (acc, code) => `${acc}${decodeOutput(encoder, code.split(''))}`,
      ''
    )
    console.log(decodedOutput)
    sumOfAllDecodedOutputs += Number(decodedOutput)
  }

  console.log({
    ones: numberCounts[2],
    fours: numberCounts[4],
    sevens: numberCounts[3],
    eights: numberCounts[7],
    sum: numberCounts[2] + numberCounts[4] + numberCounts[3] + numberCounts[7],
  })

  console.log({ sumOfAllDecodedOutputs })
}

run(settings.example)
run(settings.real)
