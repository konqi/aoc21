type Coordinate = { x: number; y: number }
type Velocity = { x: number; y: number }

interface Vector {
  position: Coordinate
  velocity: Velocity
}

interface Target {
  start: Coordinate
  end: Coordinate
}

const settings = {
  example: { start: { x: 20, y: -10 }, end: { x: 30, y: -5 } } as Target,
  real: { start: { x: 207, y: -115 }, end: { x: 263, y: -63 } } as Target,
}

function toString(val: Coordinate | Velocity) {
  return `(${val.x}|${val.y})`
}

function step({ position, velocity }: Vector): Vector {
  return {
    // increase x/y position by x/y velocity
    position: { x: position.x + velocity.x, y: position.y + velocity.y },
    // move x 1 closer to 0 velocity, decrease y velocity
    velocity: {
      x: velocity.x ? velocity.x - Math.abs(velocity.x) / velocity.x : 0,
      y: velocity.y - 1,
    },
  }
}

function test(target: Target, coordinate: Coordinate) {
  const x = coordinate.x >= target.start.x && coordinate.x <= target.end.x
  const y = coordinate.y >= target.start.y && coordinate.y <= target.end.y
  return x && y
}

function fire(target: Target, velocity: Velocity, telemetry: Vector[] = []) {
  const position: Coordinate = { x: 0, y: 0 }
  let vector: Vector = { position, velocity }

  const min = Math.min(target.end.y, target.start.y)
  while (vector.position.y >= min) {
    vector = step(vector)
    telemetry.push(vector)
    if (test(target, vector.position)) {
      return true
    }
  }

  return false
}

async function run(target: Target) {
  const hits: Velocity[] = []

  let minXVelocity = 0
  let theoreticalDistance = 0
  while (theoreticalDistance < target.start.x) {
    minXVelocity++
    theoreticalDistance += minXVelocity
  }

  for (let xVelo = minXVelocity; xVelo <= target.end.x; xVelo++) {
    // well there should be a better way to find the maximum possible velocity - but i'm really lazy ;-)
    for (let yVelo = target.start.y; yVelo < 500; yVelo++) {
      const velocity: Velocity = { x: xVelo, y: yVelo }
      if (fire(target, velocity)) {
        hits.push(velocity)
      }
    }
  }

  const orderedVelocity = hits.sort(({ y: a }, { y: b }) => b - a)

  console.log(`Number of possible shots: ${orderedVelocity.length}`)
  const stylishShot = orderedVelocity[0]
  console.log(`Most stylish shot (max y velocity): ${toString(stylishShot)}`)
  console.log(
    `Least stylish shot (min y velocity): ${toString(
      orderedVelocity[orderedVelocity.length - 1]
    )}`
  )

  const telemetry: Vector[] = []
  fire(target, stylishShot, telemetry)

  const orderedTelemetry = telemetry.sort(
    ({ position: { y: a } }, { position: { y: b } }) => b - a
  )
  console.log(
    `Highest point of stylish shot: ${toString(orderedTelemetry[0].position)}`
  )
}

run(settings.example)
run(settings.real)
