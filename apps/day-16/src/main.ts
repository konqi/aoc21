import { readFile } from 'fs/promises'
import { isNumber } from 'lodash'

interface Settings {
  filename: string
  revolutions: number
}

const settings: Record<string, Settings> = {
  example: {
    filename: 'example8.txt',
    revolutions: 10,
  },
  real: {
    filename: 'input.txt',
    revolutions: 10,
  },
}

enum OPERATION {
  SUM = 0,
  PRODUCT = 1,
  MIN = 2,
  MAX = 3,
  NUMBER = 4,
  GT = 5,
  LT = 6,
  EQL = 7,
  ROOT = -1,
}

class Node {
  operation: OPERATION
  expectedSubnodes = 0
  value: number
  subnodes: Node[] = []
  packetVersion: number

  constructor(public parent: Node = null) {
    if (parent) {
      parent.subnodes.push(this)
    }
  }

  interpret(depth = 0): number {
    // console.log(
    //   `${''.padStart(depth * 2, ' ')}${OPERATION[this.operation ?? '']} ${
    //     this.value ?? ''
    //   }`
    // )

    switch (this.operation) {
      case OPERATION.NUMBER:
        return this.value
      case OPERATION.SUM:
        return this.subnodes.reduce(
          (acc, node) => acc + node.interpret(depth + 1),
          0
        )
      case OPERATION.PRODUCT:
        return this.subnodes.reduce(
          (acc, node) => acc * node.interpret(depth + 1),
          1
        )
      case OPERATION.MAX:
        return Math.max(
          ...this.subnodes.map((node) => node.interpret(depth + 1))
        )
      case OPERATION.MIN:
        return Math.min(
          ...this.subnodes.map((node) => node.interpret(depth + 1))
        )
      case OPERATION.EQL:
        return Number(
          this.subnodes[0].interpret(depth + 1) ===
            this.subnodes[1].interpret(depth + 1)
        )
      case OPERATION.LT:
        return Number(
          this.subnodes[0].interpret(depth + 1) <
            this.subnodes[1].interpret(depth + 1)
        )
      case OPERATION.GT:
        return Number(
          this.subnodes[0].interpret(depth + 1) >
            this.subnodes[1].interpret(depth + 1)
        )
      case OPERATION.ROOT:
        return this.subnodes[0].interpret()
    }
  }

  sumVersions() {
    return (
      this.packetVersion +
      this.subnodes.reduce((acc, node) => acc + node.sumVersions(), 0)
    )
  }
}

function b2n(buffer: Buffer) {
  return parseInt(buffer.toString(), 2)
}

class BitReader {
  private bitBuffer

  constructor(buffer: Buffer) {
    this.bitBuffer = BitReader.hexToBits(buffer)
  }

  private static hexToBits(hexBuf: Buffer) {
    const bitBuffer = Buffer.alloc(hexBuf.length * 4)
    hexBuf.forEach((value, index) => {
      bitBuffer.write(
        parseInt(String.fromCharCode(value), 16).toString(2).padStart(4, '0'),
        index * 4
      )
    })
    return bitBuffer
  }

  readBits(numberOfBits: number) {
    const bitsToReturn = this.bitBuffer.slice(0, numberOfBits)
    this.bitBuffer = this.bitBuffer.slice(numberOfBits)
    return bitsToReturn
  }

  readSlice(numberOfBits: number) {
    const reader = new BitReader(Buffer.of())
    reader.bitBuffer = this.readBits(numberOfBits)
    return reader
  }

  flush() {
    this.bitBuffer = Buffer.of()
  }

  get length() {
    return this.bitBuffer.length
  }
}

function read(bitReader: BitReader, max: number = undefined): Node[] {
  const nodes = []

  while (bitReader.length > 7) {
    const current = new Node()
    nodes.push(current)

    // read header
    // 3 bits of packet version
    current.packetVersion = b2n(bitReader.readBits(3))
    // 3 bits of packet type id
    const packetTypeId = b2n(bitReader.readBits(3))
    current.operation = packetTypeId
    if (packetTypeId === 4) {
      // LITERAL VALUE
      // read 5 bits
      let buf = Buffer.of()
      let repeat = true
      while (repeat) {
        // if bit[0] === 1 loop
        repeat = Boolean(b2n(bitReader.readBits(1)))
        buf = Buffer.concat([buf, bitReader.readBits(4)])
      }
      current.value = b2n(buf)
    } else {
      // OPERATOR
      // read 1 bit length type id
      const lengthTypeId = b2n(bitReader.readBits(1))
      if (lengthTypeId === 0) {
        // this means how many bits
        const subpacketsBits = b2n(bitReader.readBits(15))
        current.subnodes = read(bitReader.readSlice(subpacketsBits))
      } else {
        // this means how many packets are expected
        current.subnodes = read(bitReader, b2n(bitReader.readBits(11)))
      }
    }

    // early quit in case max number is set
    if (isNumber(max)) {
      max--
      if (max === 0) {
        return nodes
      }
    }
  }

  return nodes
}

const run = async (settings: Settings) => {
  const buffer = await readFile(`${__dirname}/assets/${settings.filename}`)
  const bitReader = new BitReader(buffer)

  const nodes = read(bitReader)
  // console.log(nodes)

  console.log('Packet Version Sum:', nodes[0].sumVersions())
  console.log('Result:', nodes[0].interpret())
  console.log('END')
}

run(settings.example)
run(settings.real)
