import { readFile } from 'fs/promises'

const identity = (num: number) => num
const calculateTriangularNumber = (num: number) => {
  let triag = 0
  while (num > 0) {
    triag += num
    --num
  }

  return triag
}

interface Settings {
  filename: string
  costFn?: (num: number) => number
}
const settings: Record<string, Settings> = {
  example: {
    filename: 'example.txt',
  },
  exampleExpensive: {
    filename: 'example.txt',
    costFn: calculateTriangularNumber,
  },
  real: {
    filename: 'input.txt',
  },
  realExpensive: {
    filename: 'input.txt',
    costFn: calculateTriangularNumber,
  },
}

const calculateFuelCost = (
  maxPos: number,
  numberOfCrabs: number,
  inputNumbers: number[],
  fuelCostFn = identity
) => {
  const differences = new Array(maxPos)
    .fill(0)
    .map(() => new Array(numberOfCrabs).fill(0).map(() => 0))

  for (let crabId = 0; crabId < numberOfCrabs; crabId++) {
    for (let targetPosition = 0; targetPosition < maxPos; targetPosition++) {
      const crabPosition = inputNumbers[crabId]
      differences[targetPosition][crabId] = fuelCostFn(
        Math.abs(targetPosition - crabPosition)
      )
    }
  }

  const maxDiffs = differences.map((targetPositions) =>
    targetPositions.reduce((acc, num) => acc + num, 0)
  )

  const winTargetPosition = maxDiffs.indexOf(Math.min(...maxDiffs))
  return { winTargetPosition, maxDiffs }
}

const calc = async ({ filename, costFn }: Settings) => {
  const inputBuf = await readFile(`${__dirname}/assets/${filename}`)
  const input = inputBuf.toString()

  const inputNumbers = input.split(',').map(Number)

  const maxPos = Math.max(...inputNumbers)
  const numberOfCrabs = inputNumbers.length

  const { winTargetPosition, maxDiffs } = calculateFuelCost(
    maxPos,
    numberOfCrabs,
    inputNumbers,
    costFn
  )

  return {
    targetPosition: winTargetPosition,
    fuel: maxDiffs[winTargetPosition],
  }
}

const run = async () => {
  for (const configuration of Object.keys(settings)) {
    const { targetPosition, fuel } = await calc(settings[configuration])
    console.log({ configuration, targetPosition, fuel })
  }
}

run()
