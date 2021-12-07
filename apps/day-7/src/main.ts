import { readFile } from 'fs/promises'

const identity = (_max: number) => (num: number) => num
const calculateTriangularNumber = (max: number) => {
  const triangulars = [0]
  for (let i = 1; i <= max; i++) {
    triangulars[i] = triangulars[i - 1] + i
  }

  return (num: number) => triangulars[num]
}

interface Settings {
  filename: string
  costFn?: (max: number) => (num: number) => number
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

const calculateFuelCost = (inputNumbers: number[], fuelCostFn = identity) => {
  const maxPos = Math.max(...inputNumbers)
  const numberOfCrabs = inputNumbers.length
  const fn = fuelCostFn(maxPos)

  const differences = new Array(maxPos)
    .fill(0)
    .map(() => new Array(numberOfCrabs).fill(0).map(() => 0))

  for (let crabId = 0; crabId < numberOfCrabs; crabId++) {
    for (let targetPosition = 0; targetPosition < maxPos; targetPosition++) {
      const crabPosition = inputNumbers[crabId]
      differences[targetPosition][crabId] = fn(
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

  const { winTargetPosition, maxDiffs } = calculateFuelCost(
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
