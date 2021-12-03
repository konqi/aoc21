import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import { unzip } from 'lodash'

const run = async () => {
  const lineReader = createInterface({
    input: createReadStream(`${__dirname}/assets/input.txt`),
  })

  const data = []
  for await (const line of lineReader) {
    data.push([...line].map((str) => parseInt(str)))
  }

  partA(data)
  const mostCommonBit = bitArrayToDecimal(partB(data, mostCommon))
  const leastCommonBit = bitArrayToDecimal(partB(data, leastCommon))
  console.log({
    mostCommonBit,
    leastCommonBit,
    product: mostCommonBit * leastCommonBit,
  })
}

run()

const bitArrayToDecimal = (bitArray: number[]) => {
  return bitArray.reduce((prev, curr, index) => {
    return prev ^ (curr << (bitArray.length - 1 - index))
  }, 0)
}

const partA = (data: number[][]) => {
  const result =
    // convert binary array to decimal
    bitArrayToDecimal(
      // transpose matrix
      unzip(data)
        // calculate word weight
        .map((column) => column.reduce((prev, curr) => prev + curr))
        // determine bit value by most common occurence
        .map((weight) => Number(weight > data.length / 2))
    )

  const bitwiseInverted = result ^ (2 ** data[0].length - 1)
  console.log({ result, bitwiseInverted, product: bitwiseInverted * result })
}

type callback = (compareValue: number, mostCommonBit: number) => boolean
const mostCommon: callback = (a, b) => a === b
const leastCommon: callback = (a, b) => a === 1 - b

const partB = (data: number[][], cb: callback) => {
  let mostCommonNextCandidates = data
  let cnt = 0
  while (mostCommonNextCandidates.length > 1) {
    const mostCommonBit = determineMostCommonBitInColumn(
      mostCommonNextCandidates,
      cnt
    )
    mostCommonNextCandidates = mostCommonNextCandidates.filter((value) =>
      cb(value[cnt], mostCommonBit)
    )
    ++cnt
  }

  return mostCommonNextCandidates[0]
}

const determineMostCommonBitInColumn = (
  data: number[][],
  columnIndex: number
) => {
  return Number(
    data.length / 2 -
      data.reduce(
        (previousValue, row) => previousValue + row[columnIndex],
        0
      ) <=
      0
  )
}
