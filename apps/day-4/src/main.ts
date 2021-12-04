import { createReadStream } from 'fs'
import { unzip } from 'lodash'
import { createInterface } from 'readline'

interface INumberSubscriber {
  publish: (num: number) => void | boolean
}

interface INumberPublisher {
  subscribe: (subscriber: INumberSubscriber) => void
}

class BoardNumber implements INumberSubscriber {
  private _marked = false
  public get marked() {
    return this._marked
  }
  public get number() {
    return this._num
  }

  constructor(private readonly _num: number) {}

  publish(num: number) {
    if (this._num === num) {
      this._marked = true
    }
  }
}

class BingoBoard implements INumberSubscriber {
  private won = false
  constructor(private readonly field: BoardNumber[][]) {}

  static parse(strBoard: string[], publisher: INumberPublisher) {
    const newBingoBoard = new BingoBoard(
      strBoard.map((line) =>
        line
          .trim()
          .split(/\s+/)
          .map((strNumber) => parseInt(strNumber))
          .map((num) => new BoardNumber(num))
          .map((boardNumber) => {
            publisher.subscribe(boardNumber)
            return boardNumber
          })
      )
    )

    publisher.subscribe(newBingoBoard)

    return newBingoBoard
  }

  publish(num: number) {
    if (!this.won) {
      // check win condition
      const markedField = this.field.map((rows) =>
        rows.map((column) => column.marked)
      )
      const rowWin = markedField.map((row) =>
        row.reduce((prev, curr) => prev && curr, true)
      )
      const colWin = unzip(markedField).map((row) =>
        row.reduce((prev, curr) => prev && curr, true)
      )
      if ([...rowWin, ...colWin].some((win) => win)) {
        console.log('BINGO ! ! !')

        this.won = true

        this.printBoard()
        console.log({
          boardSum: this.getWinSum(),
          num,
          total: this.getWinSum() * num,
        })
        return true
      }
    }
  }

  printBoard() {
    console.log(
      this.field.map((row) =>
        row.map(
          (column) =>
            `${column.marked ? '*' : ' '}${String(column.number).padStart(
              2,
              ' '
            )}${column.marked ? '*' : ' '}`
        )
      )
    )
  }

  getWinSum() {
    return this.field.reduce((previous, row) => {
      return (
        previous +
        row.reduce((previousCol, currentCol) => {
          return previousCol + (currentCol.marked ? 0 : currentCol.number)
        }, 0)
      )
    }, 0)
  }
}

class NumberPublisher implements INumberPublisher {
  subscribers: INumberSubscriber[] = []
  constructor(private readonly winNumbers) {
    console.log(winNumbers)
  }

  static parse(numberStr: string) {
    return new NumberPublisher(numberStr.split(',').map((num) => parseInt(num)))
  }

  subscribe(subscriber: INumberSubscriber) {
    this.subscribers.push(subscriber)
  }

  run() {
    for (let i = 0; i < this.winNumbers.length; i++) {
      for (const subscriber of this.subscribers) {
        if (subscriber.publish(this.winNumbers[i])) {
          //   return
        }
      }
    }
  }
}

const run = async () => {
  const lineReader = createInterface({
    input: createReadStream(`${__dirname}/assets/example.txt`),
  })

  let numberPublisher: NumberPublisher | undefined = undefined
  let fieldData = []
  for await (const line of lineReader) {
    if (!numberPublisher) {
      numberPublisher = NumberPublisher.parse(line)
      continue
    }

    if (line.trim().length === 0 && fieldData.length > 0) {
      BingoBoard.parse(fieldData, numberPublisher)
      fieldData = []
    } else if (line.trim().length > 0) {
      fieldData.push(line)
    }
  }
  if (fieldData.length > 0) {
    BingoBoard.parse(fieldData, numberPublisher)
  }

  numberPublisher.run()
}

run()
