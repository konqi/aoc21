import { createReadStream } from 'fs'
import { createInterface } from 'readline'

enum CHANGE_TYPE {
  NA = '(N/A - no previous measurement)',
  INCREASED = '(increased)',
  DECREASED = '(decreased)',
  UNCHANGED = '(unchanged)',
}

const determineChange = (previousValue, currentValue) => {
  if (previousValue === null || isNaN(previousValue)) {
    return CHANGE_TYPE.NA
  } else if (previousValue < currentValue) {
    return CHANGE_TYPE.INCREASED
  } else if (previousValue > currentValue) {
    return CHANGE_TYPE.DECREASED
  } else {
    return CHANGE_TYPE.UNCHANGED
  }
}

const createWindow = (size: number) => {
  const window: number[] = new Array(3).fill(undefined)
  let cnt = 0
  return (value: number) => {
    window[cnt] = value
    cnt = (cnt + 1) % size

    return window.reduce((prev, curr) => prev + curr, 0)
  }
}

const run = async () => {
  const lineReader = createInterface({
    input: createReadStream(`${__dirname}/assets/input.txt`),
  })

  let previousDepth = null
  let previousWindowValue = NaN
  const changesCounter: Record<CHANGE_TYPE, number> = {
    [CHANGE_TYPE.NA]: 0,
    [CHANGE_TYPE.INCREASED]: 0,
    [CHANGE_TYPE.DECREASED]: 0,
    [CHANGE_TYPE.UNCHANGED]: 0,
  }
  const windowChangesCounter: Record<CHANGE_TYPE, number> = {
    [CHANGE_TYPE.NA]: 0,
    [CHANGE_TYPE.INCREASED]: 0,
    [CHANGE_TYPE.DECREASED]: 0,
    [CHANGE_TYPE.UNCHANGED]: 0,
  }

  const windowFn = createWindow(3)

  for await (const line of lineReader) {
    const depth = parseInt(line)
    const windowDepth = windowFn(depth)
    const change = determineChange(previousDepth, depth)
    const windowChange = determineChange(previousWindowValue, windowDepth)
    console.debug(`${depth} ${change}`)
    console.debug(`window ${windowDepth} ${windowChange}`)
    changesCounter[change]++
    windowChangesCounter[windowChange]++

    previousDepth = depth
    previousWindowValue = windowDepth
  }

  console.log(changesCounter)
  console.log(windowChangesCounter)
}

run()
