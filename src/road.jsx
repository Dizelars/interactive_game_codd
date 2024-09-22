import { MeshLOD } from './meshLOD'
import React from 'react'
class Road extends MeshLOD {
  constructor({
    x = 0,
    y = 0,
    rotation = [0, 0, 0],
    blocked = [],
    points = [],
    gltfURL = '/Roads/CrossroadX',
    debug = false,
    distances = [20, 30, 40, 50],
  }) {
    super({ rotation, gltfURL, distances })
    this.coordinates = {
      x,
      y,
    }
    this.points = points
    this.blocked = blocked
    this.debug = debug
  }
  create(key) {
    for (let i = 0; i < this.points.length; i++) {
      if (this.blocked.findIndex((block) => block == i) != -1) continue
      this.points[i].xW =
        Math.round((this.points[i].x + this.coordinates.x) * 1000) / 1000
      this.points[i].yW =
        Math.round((this.points[i].y + this.coordinates.y) * 1000) / 1000
      this.points[i].index = i
    }

    return (
      <group
        key={`road-${key}`}
        position={[this.coordinates.x, 0, this.coordinates.y]}
      >
        {this.LOD()}
        {this.showDebug()}
      </group>
    )
  }
  showDebug() {
    if (this.debug)
      return this.points.map((point, index) => {
        const color = !point.direction ? '#a83232' : '#32a852'
        if (this.blocked.findIndex((block) => block == index) == -1)
          return (
            <mesh
              key={index}
              position={[point.x, 0, point.y]}
              onClick={() => console.log('debug', { index, point })}
            >
              <sphereGeometry args={[0.05, 6, 6]} />
              <meshStandardMaterial color={color} />
            </mesh>
          )
      })
  }
}

const calculatePointPositon = (position, rotation) => {
  if (rotation[1] == 0) return [position, position]
  else if (rotation[1] == Math.PI) return [position * -1, position * -1]
  else if (rotation[1] == Math.PI / 2) return [position, position * -1]
  else if (rotation[1] == Math.PI * 1.5) return [position * -1, position]
}
const calculatePointDirection = (rotation) => {
  if (rotation[1] == 0) return true
  else if (rotation[1] == Math.PI) return true
  else if (rotation[1] == Math.PI / 2) return false
  else if (rotation[1] == Math.PI * 1.5) return false
}
const calculatePointBlock = (rotation) => {
  if (rotation[1] == 0) return [12, 13, 14, 15, 24, 22, 23, 20, 26]
  else if (rotation[1] == Math.PI) return [8, 9, 10, 11, 18, 16, 17, 25, 27]
  else if (rotation[1] == Math.PI / 2) return [4, 5, 6, 7, 24, 18, 25, 19, 22]
  else if (rotation[1] == Math.PI * 1.5) return [0, 1, 2, 3, 27, 26, 16, 21, 20]
}
class CrossroadX extends Road {
  constructor({ x, y, debug }) {
    super({
      points: [
        {
          x: 1.1,
          y: 0.51, // 0
          direction: false,
          connections: [],
        },
        {
          x: 1.1,
          y: 0.17, // 1
          direction: false,
          connections: [],
        },
        {
          x: 1.1,
          y: -0.51, // 2
          direction: true,
          connections: [21],
        },
        {
          x: 1.1,
          y: -0.17, // 3
          direction: true,
          connections: [27, 7],
        },
        {
          x: -1.1,
          y: 0.51, // 4
          direction: true,
          connections: [19],
        },
        {
          x: -1.1,
          y: 0.17, // 5
          direction: true,
          connections: [24, 1],
        },
        {
          x: -1.1,
          y: -0.51, // 6
          direction: false,
          connections: [],
        },
        {
          x: -1.1,
          y: -0.17, // 7
          direction: false,
          connections: [],
        },
        {
          x: 0.51,
          y: 1.1, // 8
          direction: true,
          connections: [17],
        },
        {
          x: 0.17,
          y: 1.1, // 9
          direction: true,
          connections: [18, 13],
        },
        {
          x: -0.51,
          y: 1.1, // 10
          direction: false,
          connections: [],
        },
        {
          x: -0.17,
          y: 1.1, // 11
          direction: false,
          connections: [],
        },
        {
          x: 0.51,
          y: -1.1, // 12
          direction: false,
          connections: [],
        },
        {
          x: 0.17,
          y: -1.1, // 13
          direction: false,
          connections: [],
        },
        {
          x: -0.51,
          y: -1.1, // 14
          direction: true,
          connections: [23],
        },
        {
          x: -0.17,
          y: -1.1, // 15
          direction: true,
          connections: [20, 11],
        },
        {
          x: 0.17,
          y: 0.51, // 16
          twoWay: true,
          connections: [11],
        },
        {
          x: 0.51,
          y: 0.51, // 17
          twoWay: true,
          connections: [0, 12],
        },
        {
          x: -0.17,
          y: 0.51, // 18
          twoWay: true,
          connections: [25],
        },
        {
          x: -0.51,
          y: 0.51, // 19
          twoWay: true,
          connections: [10, 0],
        },
        {
          x: 0.17,
          y: -0.51, // 20
          twoWay: true,
          connections: [26],
        },
        {
          x: 0.51,
          y: -0.51, // 21
          twoWay: true,
          connections: [12, 6],
        },
        {
          x: -0.17,
          y: -0.51, // 22
          twoWay: true,
          connections: [13],
        },
        {
          x: -0.51,
          y: -0.51, // 23
          twoWay: true,
          connections: [6, 10],
        },
        {
          x: -0.51,
          y: -0.17, // 24
          twoWay: true,
          connections: [22],
        },
        {
          x: -0.51,
          y: 0.17, // 25
          twoWay: true,
          connections: [7],
        },
        {
          x: 0.51,
          y: -0.17, // 26
          twoWay: true,
          connections: [1],
        },
        {
          x: 0.51,
          y: 0.17, // 27
          twoWay: true,
          connections: [16],
        },
      ],
      x,
      y,
      debug,
    })
  }
}
class CrossroadT extends Road {
  constructor({ x, y, rotation, debug }) {
    super({
      points: [
        {
          x: 1.1,
          y: 0.51, // 0
          direction: false,
          connections: [],
        },
        {
          x: 1.1,
          y: 0.17, // 1
          direction: false,
          connections: [],
        },
        {
          x: 1.1,
          y: -0.51, // 2
          direction: true,
          connections: [21],
        },
        {
          x: 1.1,
          y: -0.17, // 3
          direction: true,
          connections: [27, 7],
        },
        {
          x: -1.1,
          y: 0.51, // 4
          direction: true,
          connections: [19],
        },
        {
          x: -1.1,
          y: 0.17, // 5
          direction: true,
          connections: [24, 1],
        },
        {
          x: -1.1,
          y: -0.51, // 6
          direction: false,
          connections: [],
        },
        {
          x: -1.1,
          y: -0.17, // 7
          direction: false,
          connections: [],
        },
        {
          x: 0.51,
          y: 1.1, // 8
          direction: true,
          connections: [17],
        },
        {
          x: 0.17,
          y: 1.1, // 9
          direction: true,
          connections: [18, 13],
        },
        {
          x: -0.51,
          y: 1.1, // 10
          direction: false,
          connections: [],
        },
        {
          x: -0.17,
          y: 1.1, // 11
          direction: false,
          connections: [],
        },
        {
          x: 0.51,
          y: -1.1, // 12
          direction: false,
          connections: [],
        },
        {
          x: 0.17,
          y: -1.1, // 13
          direction: false,
          connections: [],
        },
        {
          x: -0.51,
          y: -1.1, // 14
          direction: true,
          connections: [23],
        },
        {
          x: -0.17,
          y: -1.1, // 15
          direction: true,
          connections: [20, 11],
        },
        {
          x: 0.17,
          y: 0.51, // 16
          twoWay: true,
          connections: [11],
        },
        {
          x: 0.51,
          y: 0.51, // 17
          twoWay: true,
          connections: [0, 12],
        },
        {
          x: -0.17,
          y: 0.51, // 18
          twoWay: true,
          connections: [25],
        },
        {
          x: -0.51,
          y: 0.51, // 19
          twoWay: true,
          connections: [10, 0],
        },
        {
          x: 0.17,
          y: -0.51, // 20
          twoWay: true,
          connections: [26],
        },
        {
          x: 0.51,
          y: -0.51, // 21
          twoWay: true,
          connections: [12, 6],
        },
        {
          x: -0.17,
          y: -0.51, // 22
          twoWay: true,
          connections: [13],
        },
        {
          x: -0.51,
          y: -0.51, // 23
          twoWay: true,
          connections: [6, 10],
        },
        {
          x: -0.51,
          y: -0.17, // 24
          twoWay: true,
          connections: [22],
        },
        {
          x: -0.51,
          y: 0.17, // 25
          twoWay: true,
          connections: [7],
        },
        {
          x: 0.51,
          y: -0.17, // 26
          twoWay: true,
          connections: [1],
        },
        {
          x: 0.51,
          y: 0.17, // 27
          twoWay: true,
          connections: [16],
        },
      ],
      gltfURL: '/Roads/CrossroadT',
      rotation,
      blocked: calculatePointBlock(rotation),
      x,
      y,
      debug,
    })
  }
}

class Turn extends Road {
  constructor({ x, y, rotation, debug }) {
    super({
      points: [
        {
          x: calculatePointPositon(1.1, rotation)[0],
          y: calculatePointPositon(0.51, rotation)[1], // 0
          direction: !calculatePointDirection(rotation),
          connections: [],
        },
        {
          x: calculatePointPositon(1.1, rotation)[0],
          y: calculatePointPositon(0.17, rotation)[1], // 1
          direction: !calculatePointDirection(rotation),
          connections: [],
        },
        {
          x: calculatePointPositon(1.1, rotation)[0],
          y: calculatePointPositon(-0.51, rotation)[1], // 2
          direction: calculatePointDirection(rotation),
          connections: [8],
        },
        {
          x: calculatePointPositon(1.1, rotation)[0],
          y: calculatePointPositon(-0.17, rotation)[1], // 3
          direction: calculatePointDirection(rotation),
          connections: [9],
        },
        {
          x: calculatePointPositon(0.51, rotation)[0],
          y: calculatePointPositon(1.1, rotation)[1], // 4
          direction: calculatePointDirection(rotation),
          connections: [11],
        },
        {
          x: calculatePointPositon(0.17, rotation)[0],
          y: calculatePointPositon(1.1, rotation)[1], // 5
          direction: calculatePointDirection(rotation),
          connections: [10],
        },
        {
          x: calculatePointPositon(-0.51, rotation)[0],
          y: calculatePointPositon(1.1, rotation)[1], // 6
          direction: !calculatePointDirection(rotation),
          connections: [],
        },
        {
          x: calculatePointPositon(-0.17, rotation)[0],
          y: calculatePointPositon(1.1, rotation)[1], // 7
          direction: !calculatePointDirection(rotation),
          connections: [],
        },
        {
          x: calculatePointPositon(-0.04, rotation)[0],
          y: calculatePointPositon(-0.04, rotation)[1], // 8
          twoWay: true,
          connections: [6],
        },
        {
          x: calculatePointPositon(0.2, rotation)[0],
          y: calculatePointPositon(0.2, rotation)[1], // 9
          twoWay: true,
          connections: [7],
        },
        {
          x: calculatePointPositon(0.44, rotation)[0],
          y: calculatePointPositon(0.44, rotation)[1], // 10
          twoWay: true,
          connections: [1],
        },
        {
          x: calculatePointPositon(0.68, rotation)[0],
          y: calculatePointPositon(0.68, rotation)[1], // 11
          twoWay: true,
          connections: [0],
        },
      ],
      gltfURL: '/Roads/Turn',
      rotation,
      x,
      y,
      debug,
    })
  }
}
class RoadPiece extends Road {
  constructor({ x, y, debug }) {
    super({
      points: [
        {
          x: 0.51,
          y: 0,
          type: 'road',
          connections: [],
        },
        {
          x: 0.17,
          y: 0,
          type: 'road',
          connections: [],
        },
        {
          x: -0.51,
          y: 0,
          type: 'road',
          connections: [],
        },
        {
          x: -0.17,
          y: 0,
          type: 'road',
          connections: [],
        },
      ],
      gltfURL: '/Roads/Road',
      x,
      y,
      debug,
    })
  }
}
class RoadPiece90 extends Road {
  constructor({ x, y, debug }) {
    super({
      points: [
        {
          x: 0,
          y: 0.51,
          type: 'road',
          connections: [],
        },
        {
          x: 0,
          y: 0.17,
          type: 'road',
          connections: [],
        },
        {
          x: 0,
          y: -0.51,
          type: 'road',
          connections: [],
        },
        {
          x: 0,
          y: -0.17,
          type: 'road',
          connections: [],
        },
      ],
      gltfURL: '/Roads/Road',
      rotation: [0, Math.PI / 2, 0],
      x,
      y,
      debug,
    })
  }
}
export { CrossroadX, CrossroadT, Turn, RoadPiece, RoadPiece90 }
