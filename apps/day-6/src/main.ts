import { readFile } from 'fs/promises'

const settings = {
  example: {
    filename: 'example.txt',
    days: 256,
  },
  real: {
    filename: 'input.txt',
    days: 256,
  },
}

const run = async () => {
  const workWith = settings.real

  const inputBuf = await readFile(`${__dirname}/assets/${workWith.filename}`)
  const input = inputBuf.toString()

  const inputNumbers = input.split(',').map(Number)

  const population = [0, 0, 0, 0, 0, 0, 0, 0, 0]

  inputNumbers.forEach((num) => population[num]++)

  console.log(population)

  //   let numberOfFishCreatingFishes = 0
  for (let i = 0; i < workWith.days; i++) {
    // today's course...
    const numberOfFishCreatingFishes = population.shift()
    // new fish need 8 days
    population.push(numberOfFishCreatingFishes)
    // old fish continues to live
    population[6] += numberOfFishCreatingFishes

    // console.log(population)
  }

  console.log(population.reduce((acc, num) => acc + num, 0))
}

run()
