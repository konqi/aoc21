import { createReadStream } from 'fs'
import { createInterface } from 'readline'

enum NavigationInput {
  UP = 'up',
  DOWN = 'down',
  FORWARD = 'forward',
}

class Navigation {
  public correctedDepth = 0
  constructor(
    public position: number,
    public depth: number,
    public aim: number
  ) {}

  up(upBy: number) {
    this.depth -= upBy
    this.aim -= upBy
  }
  down(downBy: number) {
    this.depth += downBy
    this.aim += downBy
  }
  forward(forwardBy: number) {
    this.position += forwardBy
    this.correctedDepth += this.aim * forwardBy
  }
}

const run = async () => {
  const nav = new Navigation(0, 0, 0)

  const lineReader = createInterface({
    input: createReadStream(`${__dirname}/assets/input.txt`),
  })

  for await (const line of lineReader) {
    const [instruction, value] = line.split(' ')
    const numberValue = parseInt(value)

    console.log(`${instruction} ${numberValue}`)

    switch (instruction as NavigationInput) {
      case NavigationInput.DOWN:
        nav.down(numberValue)
        break
      case NavigationInput.UP:
        nav.up(numberValue)
        break
      case NavigationInput.FORWARD:
        nav.forward(numberValue)
        break
      default:
        throw Error('Invalid command!')
    }
  }

  console.log(
    `Position: ${nav.position}, Depth: ${nav.depth}, Product: ${
      nav.depth * nav.position
    }`
  )
  console.log(
    `Position: ${nav.position}, Depth: ${nav.depth}, Product: ${
      nav.depth * nav.position
    }`
  )
  console.log('CORRECTED VERSION')
  console.log(
    `Position: ${nav.position}, Depth: ${nav.correctedDepth}, Product: ${
      nav.correctedDepth * nav.position
    }`
  )
}

run()
