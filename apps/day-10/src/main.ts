import { createReadStream } from 'fs'
import { chain, isArguments } from 'lodash'
import { createInterface } from 'readline'

interface Settings {
  filename: string
  debug: boolean
}

const settings: Record<string, Settings> = {
  example: {
    filename: 'example.txt',
    debug: true,
  },
  real: {
    filename: 'input.txt',
    debug: false,
  },
}

const matchingBrackets = {
  '(': ')',
  '[': ']',
  '{': '}',
  '<': '>',
}
const openingBrackets = Object.keys(matchingBrackets)
const closingBrackets = Object.values(matchingBrackets)

const syntaxErrorPointsMap = {
  ')': 3,
  ']': 57,
  '}': 1197,
  '>': 25137,
}

const autocompletePointsMap = {
  ')': 1,
  ']': 2,
  '}': 3,
  '>': 4,
}

class Bracket {
  private isClosed = false
  private children: Bracket[] = []
  constructor(
    private readonly type: string,
    private readonly parent: Bracket = undefined
  ) {}

  close(type: string) {
    if (type !== matchingBrackets[this.type]) {
      throw Object.assign(
        new Error(
          `Expected ${matchingBrackets[this.type]}, but found ${type} insted.`
        ),
        { bracket: type, syntaxErrorPoints: syntaxErrorPointsMap[type] }
      )
    }

    this.isClosed = true

    return this.parent
  }

  addChild(bracket: Bracket) {
    this.children.push(bracket)
  }

  interpret() {
    const childrenValue = this.children.reduce(
      (acc, child) => [...acc, ...child.interpret()],
      []
    )
    return [
      ...childrenValue,
      ...(this.isClosed ? [] : [matchingBrackets[this.type]]),
    ]
  }
}

const run = async (settings: Settings) => {
  const lineReader = createInterface({
    input: createReadStream(`${__dirname}/assets/${settings.filename}`),
  })

  let syntaxErrorPoints = 0
  const correctLines = []

  for await (const line of lineReader) {
    let root: Bracket | undefined = undefined
    let parent: Bracket | undefined = undefined

    try {
      for (const bracket of line.split('')) {
        if (openingBrackets.includes(bracket)) {
          const newBracket = new Bracket(bracket, parent)
          if (!root) {
            root = newBracket
          }
          if (parent) {
            parent.addChild(newBracket)
          }

          parent = newBracket
        } else if (closingBrackets.includes(bracket)) {
          parent = parent.close(bracket)
          if (!parent) {
            root = undefined
          }
        }
      }

      correctLines.push(root)
    } catch (e) {
      if (settings.debug) console.log(e.message)
      syntaxErrorPoints += e.syntaxErrorPoints
      continue
    }
  }

  console.log({ syntaxErrorPoints })

  const autoCompletions = correctLines.map((line) => line.interpret())
  const autoCompletePoints = autoCompletions.map((line) =>
    line.map((bracket) => autocompletePointsMap[bracket])
  )
  const scores = autoCompletePoints.map((line) =>
    line.reduce((acc, points) => 5 * acc + points, 0)
  )

  console.log({
    autocompleteHighscore: scores.sort((a, b) => a - b)[
      (scores.length - 1) / 2
    ],
  })
}

run(settings.example)
run(settings.real)
