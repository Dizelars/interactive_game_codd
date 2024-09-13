import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  CameraControls,
  PerspectiveCamera,
  Stats,
  useGLTF,
  Detailed,
  Box,
  Plane,
  Cone,
  useTexture,
} from '@react-three/drei'
import { useErrorBoundary } from 'use-error-boundary'
import * as THREE from 'three'

const SetupToneMapping = () => {
  const { gl } = useThree()
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 2
  }, [gl])
  return null
}

class Loader {
  constructor() {
    this.models = {}
  }
  load(url = '') {
    if (url.length == 0) return
    if (Array.isArray(url)) {
      url.map((item) => {
        this.models[item] = useGLTF(url)
      })
    } else this.models[url] = useGLTF(url)
  }
  get(url = '') {
    if (url.length == 0 && !this.isLoaded(url))
      return { nodes: {}, materials: {} }
    if (this.isLoaded(url)) return this.models[url]
    else this.load(url)
    return this.models[url]
  }
  isLoaded(url = '') {
    if (url.length == 0) return
    return !!this.models[url]
  }
}

class Navigator {
  constructor() {
    this.points = []
    this.graph = []
    this.edges = []
    this.debug = false
  }
  getRandomEdgePoint = () => {
    const getRandomNum = (max, min = 0) => Math.random() * (max - min) + min
    return this.edges[Math.floor(getRandomNum(this.edges.length))]
  }
  generateRandomRoute() {
    const randomStartPoint = this.getRandomEdgePoint().pointA
    const randomEndPoint = this.getRandomEdgePoint().pointB
    const result = this.dijkstra(
      this.serializePoint({ x: randomStartPoint.xW, y: randomStartPoint.yW }),
      this.serializePoint({ x: randomEndPoint.xW, y: randomEndPoint.yW })
    )

    if (result.path.length > 5) {
      this.lastPoint = randomEndPoint
      const curvePoints = result.path.map(
        (point) => new THREE.Vector3(point.x, 0, point.y)
      )
      const curve = new THREE.CatmullRomCurve3(curvePoints)
      curve.points = curve.getPoints(Math.floor(result.distance * 100))
      return { curve, distance: result.distance }
    } else {
      return {
        curve: new THREE.CatmullRomCurve3([]),
        distance: result.distance,
      }
    }
  }
  generateRoute(pointA = { x: 0, y: 0 }, pointB = { x: 0, y: 0 }) {
    if (pointA.x != 0 && pointA.y != 0 && pointB.x != 0 && pointB.y != 0) {
      const result = this.dijkstra(
        this.serializePoint(pointA),
        this.serializePoint(pointB)
      )
      if (this.debug) console.log(result)

      if (result.path.length > 1) {
        const curvePoints = result.path.map(
          (point) => new THREE.Vector3(point.x, 0, point.y)
        )
        const curve = new THREE.CatmullRomCurve3(curvePoints)
        curve.points = curve.getPoints(Math.floor(result.distance * 100))
        return { curve, distance: result.distance }
      } else {
        return {
          curve: new THREE.CatmullRomCurve3([]),
          distance: result.distance,
        }
      }
    } else return this.generateRandomRoute()
  }
  generateGraph() {
    const points = this.points
    let lines = []
    const calculateDistance = (pointA, pointB) => {
      return (
        Math.round(
          Math.sqrt(
            (pointB.xW - pointA.xW) ** 2 + (pointB.yW - pointA.yW) ** 2
          ) * 1000
        ) / 1000
      )
    }
    const loadConnectedPoints = (pointA) => {
      for (let j = 0; j < pointA.connections.length; j++) {
        const connectedPoint = this.points.find(
          (point) =>
            point.index === pointA.connections[j] &&
            calculateDistance(point, pointA) < 2.3
        )

        if (connectedPoint) {
          const distance = calculateDistance(pointA, connectedPoint)
          lines.push({
            indexA: this.points.findIndex(
              (point) => point.xW === pointA.xW && point.yW === pointA.yW
            ),
            indexB: this.points.findIndex(
              (point) =>
                point.xW === connectedPoint.xW && point.yW === connectedPoint.yW
            ),
            distance,
            pointA,
            pointB: connectedPoint,
          })
          if (connectedPoint.connections.length > 0)
            loadConnectedPoints(connectedPoint)
        }
      }
    }
    const removeDublicates = (lines) => {
      return lines.reduce((accumulator, item) => {
        const pair = [item.indexA, item.indexB].sort((a, b) => a - b).join(',')
        if (
          !accumulator.some((existing) => {
            const existingPair = [existing.indexA, existing.indexB]
              .sort((a, b) => a - b)
              .join(',')
            return existingPair === pair
          })
        ) {
          accumulator.push(item)
        }
        return accumulator
      }, [])
    }
    for (let i = 0; i < points.length; i++) {
      const pointA = points[i]
      for (let j = 0; j < points.length; j++) {
        if (i === j) continue
        const pointB = points[j]
        const distance = calculateDistance(pointA, pointB)

        const hasRA = pointA.hasOwnProperty('r')
        const hasRB = pointB.hasOwnProperty('r')
        const hasDirectionA = pointA.hasOwnProperty('direction')
        const hasDirectionB = pointB.hasOwnProperty('direction')
        const isXRoadTile =
          (pointA.x <= 0 && pointB.x <= 0) || (pointA.x >= 0 && pointB.x >= 0)

        // Определение "одинаковой стороны"
        const sameSide =
          hasRA || hasRB
            ? hasDirectionA || hasDirectionB
              ? pointA.x === pointB.y || pointA.y === pointB.x
              : isXRoadTile
            : hasDirectionA || hasDirectionB
              ? pointA.x === pointB.x || pointA.y === pointB.y
              : isXRoadTile

        const differentDirection = hasDirectionA !== hasDirectionB
        if (distance > 0.69 && distance < 0.8 && sameSide) {
          if (pointA.y == pointB.y || differentDirection) {
            lines.push({ indexA: i, indexB: j, distance, pointA, pointB })
          }
        }
      }
    }

    lines = removeDublicates(lines)
    const linesWithConnections = lines.filter(
      (line) =>
        line.pointA.connections.length > 0 || line.pointB.connections.length > 0
    )
    for (let i = 0; i < linesWithConnections.length; i++) {
      const line = linesWithConnections[i]
      const { pointA, pointB } = line
      if (pointA.connections.length > 0) {
        loadConnectedPoints(pointA)
      } else {
        for (let j = 0; j < pointB.connections.length; j++) {
          console.log(pointB.connections[j])
        }
      }
    }

    lines = removeDublicates(lines)

    const updateDirections = (lines, startLine, direction) => {
      const stack = [startLine] // Используем стек для обхода графа
      const visited = new Set() // Чтобы не посещать одно и то же ребро несколько раз

      while (stack.length > 0) {
        const currentLine = stack.pop()

        if (visited.has(currentLine)) continue // Пропускаем уже посещенные рёбра
        visited.add(currentLine)

        // Обновляем направление для текущего ребра
        if (!currentLine.direction) {
          currentLine.direction = direction
          lines[currentLine.index] = currentLine // Обновляем в исходном массиве

          // Получаем соседние рёбра
          const neighbors = lines.filter(
            (line) =>
              (line.pointA === currentLine.pointB &&
                line.pointB !== currentLine.pointA) ||
              (line.pointB === currentLine.pointA &&
                line.pointA !== currentLine.pointB)
          )

          // Добавляем соседние рёбра в стек для последующей обработки
          neighbors.forEach((neighbor) => {
            if (!visited.has(neighbor)) {
              stack.push(neighbor)
            }
          })
        }
      }
    }
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (
        (line.pointA.hasOwnProperty('direction') &&
          line.pointB.type &&
          line.pointB?.type === 'road') ||
        (line.pointB.hasOwnProperty('direction') &&
          line.pointA.type &&
          line.pointA?.type === 'road')
      ) {
        if (line.pointA.direction) {
          updateDirections(lines, line, 'BtoA')
        } else {
          updateDirections(lines, line, 'AtoB')
        }
      }
    }
    const graph = new Map()
    lines.forEach((edge) => {
      const { distance, pointA, pointB, direction } = edge

      const keyA = this.serializePoint({ x: pointA.xW, y: pointA.yW })
      const keyB = this.serializePoint({ x: pointB.xW, y: pointB.yW })

      // Инициализация вершин в графе, если их еще нет
      if (!graph.has(keyA)) {
        graph.set(keyA, [])
      }
      if (!graph.has(keyB)) {
        graph.set(keyB, [])
      }

      // Добавляем рёбра в зависимости от направления
      if (direction === 'AtoB') {
        graph.get(keyA).push({ point: keyB, distance })
      } else if (direction === 'BtoA') {
        graph.get(keyB).push({ point: keyA, distance })
      }
    })

    this.edges = [...lines]
    return (this.graph = graph)
  }
  dijkstra(start, end) {
    if (!this.graph.has(start) || !this.graph.has(end)) {
      console.error('Start or end point not in graph')
      return { path: [], distance: Infinity }
    }

    const distances = new Map() // Stores shortest distance from start to each node
    const previousNodes = new Map() // Stores previous node for each node
    const unvisitedNodes = new Set(this.graph.keys()) // All nodes to be visited

    // Initialize distances and previous nodes
    for (const node of this.graph.keys()) {
      distances.set(node, Infinity)
      previousNodes.set(node, null)
    }
    distances.set(start, 0)

    while (unvisitedNodes.size > 0) {
      // Get the node with the smallest distance
      let currentNode = null
      for (const node of unvisitedNodes) {
        if (
          currentNode === null ||
          distances.get(node) < distances.get(currentNode)
        ) {
          currentNode = node
        }
      }

      if (distances.get(currentNode) === Infinity) {
        break // All remaining nodes are unreachable
      }

      // Update distances to neighbors
      for (const neighbor of this.graph.get(currentNode)) {
        const alternativeDistance =
          distances.get(currentNode) + neighbor.distance
        if (alternativeDistance < distances.get(neighbor.point)) {
          distances.set(neighbor.point, alternativeDistance)
          previousNodes.set(neighbor.point, currentNode)
        }
      }

      unvisitedNodes.delete(currentNode)
    }

    // Reconstruct shortest path
    const path = []
    let currentNode = end
    while (currentNode !== null) {
      path.unshift(this.deserializePoint(currentNode))
      currentNode = previousNodes.get(currentNode)
    }

    // Ensure that the path starts with the start node
    const startPoint = this.deserializePoint(start)
    if (
      path.length === 0 ||
      path[0].x !== startPoint.x ||
      path[0].y !== startPoint.y
    ) {
      if (this.debug) console.warn('Path reconstruction issue')
      return { path: [], distance: Infinity }
    }

    return {
      path,
      distance:
        distances.get(end) !== undefined ? distances.get(end) : Infinity,
    }
  }
  serializePoint(point) {
    return `${Math.round(point.x * 1000) / 1000},${Math.round(point.y * 1000) / 1000}`
  }
  deserializePoint(pointStr) {
    const [x, y] = pointStr.split(',').map(Number)
    return { x, y }
  }
}

class Road {
  constructor({ x = 0, y = 0, type = 0, blocked = [], r = 0 }) {
    this.coordinates = {
      x,
      y,
      r,
    }
    this.ref = useRef()
    this.points = []
    this.type = type
    this.listOfTypes = [
      {
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
        url: 'Road_2',
      },
      {
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
            connections: [11],
          },
          {
            x: 0.51,
            y: 0.51, // 17
            connections: [0, 12],
          },
          {
            x: -0.17,
            y: 0.51, // 18
            connections: [10, 25],
          },
          {
            x: -0.51,
            y: 0.51, // 19
            connections: [10, 0],
          },
          {
            x: 0.17,
            y: -0.51, // 20
            connections: [12, 26],
          },
          {
            x: 0.51,
            y: -0.51, // 21
            connections: [12, 6],
          },
          {
            x: -0.17,
            y: -0.51, // 22
            connections: [13],
          },
          {
            x: -0.51,
            y: -0.51, // 23
            connections: [6, 10],
          },
          {
            x: -0.51,
            y: -0.17, // 24
            connections: [6, 22],
          },
          {
            x: -0.51,
            y: 0.17, // 25
            connections: [7],
          },
          {
            x: 0.51,
            y: -0.17, // 26
            connections: [1],
          },
          {
            x: 0.51,
            y: 0.17, // 27
            connections: [0, 16],
          },
        ],
        url: 'Road_Crossroads_1',
      },
    ]
    this.blocked = blocked
  }
  create(key) {
    const { nodes, materials } = loader.get(
      `/assets/Roads/${this.listOfTypes[this.type].url}.gltf`
    )
    const points = this.listOfTypes[this.type].points
    for (let i = 0; i < points.length; i++) {
      if (this.blocked.findIndex((block) => block == i) != -1) continue
      const point = points[i]
      if (this.coordinates.r == 2) {
        this.listOfTypes[this.type].points[i].xW =
          Math.round((point.y + this.coordinates.x) * 1000) / 1000
        this.listOfTypes[this.type].points[i].yW =
          Math.round((point.x + this.coordinates.y) * 1000) / 1000
        this.listOfTypes[this.type].points[i].r = this.coordinates.r
      } else {
        this.listOfTypes[this.type].points[i].xW =
          Math.round((point.x + this.coordinates.x) * 1000) / 1000
        this.listOfTypes[this.type].points[i].yW =
          Math.round((point.y + this.coordinates.y) * 1000) / 1000
      }
      this.listOfTypes[this.type].points[i].index = i
      this.points.push(this.listOfTypes[this.type].points[i])
    }

    return (
      <group
        ref={this.ref}
        key={key}
        position={[this.coordinates.x, 0, this.coordinates.y]}
        rotation={[
          0,
          this.coordinates.r == 0 ? 0 : Math.PI / this.coordinates.r,
          0,
        ]}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes[this.listOfTypes[this.type].url].geometry}
          material={materials.Mat}
          scale={0.07}
        />
        {this.debug(false)}
      </group>
    )
  }
  debug(show = true) {
    return this.listOfTypes[this.type].points.map((point, index) => {
      const color = !point.direction ? '#a83232' : '#32a852'
      if (this.blocked.findIndex((block) => block == index) == -1 && show)
        return (
          <mesh
            key={index}
            position={[point.x, 0, point.y]}
            onClick={() => console.log('debug', { index, ...point })}
          >
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial color={color} />
          </mesh>
        )
    })
  }
  setPoints(points = []) {
    this.points = []
    this.points.push(...points)
  }
}

class Car {
  constructor(navigator = Navigator) {
    this.coordinates = [0, 0]
    this.garageID = 0
    this.ref = useRef()
    this.speed = 60
    this.progress = 1
    this.path = []
    this.curve = useRef(new THREE.CurvePath())
    this.curveRef = useRef()
    this.curveRefOld = useRef()
    this.navigator = navigator
    this.canMove = true
    this.showTrace = false
    this.lastPoint = undefined
  }
  create() {
    const frameCountRef = useRef(0)
    const n = 2 // Выполнять функцию каждые n кадров

    useFrame(() => {
      frameCountRef.current += 1
      if (frameCountRef.current % n === 0) {
        this.move()
      }
    })
    // const model = Math.random() < 0.5 ? 'Truck_2' : 'Car_2_1'
    const model = 'Truck_2'

    const { nodes, materials } = loader.get(`/assets/Vehicles/${model}.gltf`)
    const LOD1 = loader.get(`/assets/Vehicles/${model}-0.7.gltf`).nodes
    const LOD2 = loader.get(`/assets/Vehicles/${model}-0.5.gltf`).nodes
    const LOD3 = loader.get(`/assets/Vehicles/${model}-0.2.gltf`).nodes
    const [gradientTexture] = useTexture(['/assets/gradient_texture.png'])
    return (
      <>
        <group ref={this.ref}>
          <Detailed distances={[2, 7, 10, 15, 20]}>
            <mesh
              rotation={[0, Math.PI / 2, 0]}
              castShadow
              receiveShadow
              geometry={nodes[model].geometry}
              material={materials.Mat}
              distance={10}
              scale={0.07}
            >
              <Cone
                args={[2, 10, 6]}
                position={[-6.7, 0, 1.15]}
                rotation={[0, 0, Math.PI / -2.6]}
              >
                <meshStandardMaterial
                  map={gradientTexture}
                  transparent={true}
                  opacity={0.3}
                />
              </Cone>
              <Cone
                args={[2, 10, 6]}
                position={[-6.7, 0, -1.15]}
                rotation={[0, 0, Math.PI / -2.6]}
              >
                <meshStandardMaterial
                  map={gradientTexture}
                  transparent={true}
                  opacity={0.3}
                />
              </Cone>
            </mesh>
            <mesh
              rotation={[0, Math.PI / 2, 0]}
              castShadow
              receiveShadow
              geometry={LOD1[model].geometry}
              material={materials.Mat}
              distance={10}
              scale={0.07}
            >
              <Cone
                args={[2, 10, 5]}
                position={[-6.7, 0, 1.15]}
                rotation={[0, 0, Math.PI / -2.6]}
              >
                <meshStandardMaterial
                  map={gradientTexture}
                  transparent={true}
                  opacity={0.3}
                />
              </Cone>
              <Cone
                args={[2, 10, 5]}
                position={[-6.7, 0, -1.15]}
                rotation={[0, 0, Math.PI / -2.6]}
              >
                <meshStandardMaterial
                  map={gradientTexture}
                  transparent={true}
                  opacity={0.3}
                />
              </Cone>
            </mesh>
            <mesh
              rotation={[0, Math.PI / 2, 0]}
              castShadow
              receiveShadow
              geometry={LOD2[model].geometry}
              material={materials.Mat}
              distance={10}
              scale={0.07}
            >
              <Cone
                args={[2, 10, 3]}
                position={[-6.7, 0, 1.15]}
                rotation={[0, 0, Math.PI / -2.6]}
              >
                <meshStandardMaterial
                  map={gradientTexture}
                  transparent={true}
                  opacity={0.3}
                />
              </Cone>
              <Cone
                args={[2, 10, 3]}
                position={[-6.7, 0, -1.15]}
                rotation={[0, 0, Math.PI / -2.6]}
              >
                <meshStandardMaterial
                  map={gradientTexture}
                  transparent={true}
                  opacity={0.3}
                />
              </Cone>
            </mesh>
            <mesh
              rotation={[0, Math.PI / 2, 0]}
              castShadow
              receiveShadow
              geometry={LOD3[model].geometry}
              material={materials.Mat}
              distance={10}
              scale={0.07}
            >
              <Cone
                args={[2, 10, 2]}
                position={[-6.7, 0, 1.15]}
                rotation={[0, 0, Math.PI / -2.6]}
              >
                <meshStandardMaterial
                  map={gradientTexture}
                  transparent={true}
                  opacity={0.3}
                />
              </Cone>
              <Cone
                args={[2, 10, 2]}
                position={[-6.7, 0, -1.15]}
                rotation={[0, 0, Math.PI / -2.6]}
              >
                <meshStandardMaterial
                  map={gradientTexture}
                  transparent={true}
                  opacity={0.3}
                />
              </Cone>
            </mesh>
            <mesh
              rotation={[0, Math.PI / 2, 0]}
              castShadow
              receiveShadow
              geometry={LOD3[model].geometry}
              material={materials.Mat}
              distance={10}
              scale={0.07}
            ></mesh>
          </Detailed>
        </group>
        <mesh ref={this.curveRef}>
          <bufferGeometry />
          <meshStandardMaterial color={'#000917'} />
        </mesh>
        <mesh ref={this.curveRefOld}>
          <bufferGeometry />
          <meshStandardMaterial color={'#003180'} />
        </mesh>
      </>
    )
  }
  move() {
    if (this.ref.current && this.curve && this.canMove) {
      this.progress += 0.001
      const getPath = () => {
        if (this.lastPoint) {
          const pointA = { x: this.lastPoint.x, y: this.lastPoint.z }
          const generatedB = this.navigator.getRandomEdgePoint().pointB
          const pointB = { x: generatedB.xW, y: generatedB.yW }
          this.curve = this.navigator.generateRoute(pointA, pointB).curve
        } else this.curve = this.navigator.generateRoute().curve
        this.progress = 0.001
        if (this.curve.points.length > 0)
          this.lastPoint = this.curve.getPoint(1)
      }
      if (this.progress > 1) getPath()
      const updateCurveGeometry = (ref, points) => {
        if (points.length > 1 && this.showTrace) {
          const curve = new THREE.CatmullRomCurve3(points)
          // Убедитесь, что вы переиспользуете старую геометрию, если это возможно
          if (ref.geometry) {
            ref.geometry.dispose()
          }
          ref.geometry = new THREE.TubeGeometry(
            curve,
            Math.round(points.length / 4),
            0.025,
            3,
            false
          )
        }
      }
      const numPoints = this.curve.points.length
      const progressRatio = this.progress * numPoints
      if (numPoints > 10) {
        const point = this.curve.getPoint(this.progress)
        const threshold = Math.floor(progressRatio)
        const oldCurve = this.curve.points.slice(0, threshold)
        const newCurve = this.curve.points.slice(threshold)
        updateCurveGeometry(this.curveRef.current, oldCurve)
        updateCurveGeometry(this.curveRefOld.current, newCurve)
        const nextPoint = this.curve.getPoint(
          Math.min(this.progress + 0.001, 1)
        )
        nextPoint.y = 0
        this.ref.current.position.set(point.x, 0, point.z)
        this.ref.current.lookAt(nextPoint)
      } else {
        getPath()
      }
    }
  }
}
const loader = new Loader()
const Scene = () => {
  const sceneRef = useRef()
  const cars = []
  const roads = []
  let edgesRef = useRef([])
  const navigator = new Navigator()
  for (let i = 0; i < 20; i++) {
    cars.push(new Car(navigator))
  }
  console.log(cars.length)
  roads.push(
    new Road({ type: 1, x: 0, y: 0, blocked: [] }), //
    new Road({ type: 1, x: 6.44, y: 0, blocked: [0, 1, 2, 3, 26] }), //
    new Road({ type: 1, x: -6.44, y: 0, blocked: [4, 5, 6, 7, 25] }),
    new Road({ type: 1, x: 0, y: 6.44, blocked: [8, 9, 10, 11, 16] }), //
    new Road({ type: 1, x: 0, y: -6.44, blocked: [12, 13, 14, 15, 22] }),
    new Road({
      type: 1,
      x: 6.44,
      y: 6.44,
      blocked: [8, 9, 10, 11, 0, 1, 2, 3, 26, 21, 17, 16, 27, 18, 19, 4, 25],
    }), //
    new Road({
      type: 1,
      x: -6.44,
      y: 6.44,
      blocked: [4, 5, 6, 7, 8, 9, 10, 11, 23, 24, 25, 22, 19, 18, 16, 17, 14],
    }),
    new Road({
      type: 1,
      x: -6.44,
      y: -6.44,
      blocked: [12, 13, 14, 15, 6, 7, 5, 4, 21, 25, 26, 19, 20, 22, 23, 24, 2],
    }),
    new Road({
      type: 1,
      x: 6.44,
      y: -6.44,
      blocked: [0, 1, 2, 3, 12, 13, 14, 15, 20, 21, 22, 23, 27, 26, 16, 17, 8],
    }),
    new Road({ type: 0, x: 0, y: 1.82 }), //
    new Road({ type: 0, x: 0, y: 2.52 }), //
    new Road({ type: 0, x: 0, y: 3.22 }), //
    new Road({ type: 0, x: 0, y: 3.92 }), //
    new Road({ type: 0, x: 0, y: 4.62 }), //

    new Road({ type: 0, x: 1.82, y: 0, r: 2 }), //
    new Road({ type: 0, x: 2.52, y: 0, r: 2 }), //
    new Road({ type: 0, x: 3.22, y: 0, r: 2 }), //
    new Road({ type: 0, x: 3.92, y: 0, r: 2 }), //
    new Road({ type: 0, x: 4.62, y: 0, r: 2 }), //

    new Road({ type: 0, x: 0, y: -1.82 }),
    new Road({ type: 0, x: 0, y: -2.52 }),
    new Road({ type: 0, x: 0, y: -3.22 }),
    new Road({ type: 0, x: 0, y: -3.92 }),
    new Road({ type: 0, x: 0, y: -4.62 }),

    new Road({ type: 0, x: -1.82, y: 0, r: 2 }),
    new Road({ type: 0, x: -2.52, y: 0, r: 2 }),
    new Road({ type: 0, x: -3.22, y: 0, r: 2 }),
    new Road({ type: 0, x: -3.92, y: 0, r: 2 }),
    new Road({ type: 0, x: -4.62, y: 0, r: 2 }),

    new Road({ type: 0, x: 6.44, y: -1.82 }),
    new Road({ type: 0, x: 6.44, y: -2.52 }),
    new Road({ type: 0, x: 6.44, y: -3.22 }),
    new Road({ type: 0, x: 6.44, y: -3.92 }),
    new Road({ type: 0, x: 6.44, y: -4.62, blocked: [0] }),

    new Road({ type: 0, x: 6.44, y: 1.82 }), //
    new Road({ type: 0, x: 6.44, y: 2.52 }), //
    new Road({ type: 0, x: 6.44, y: 3.22 }), //
    new Road({ type: 0, x: 6.44, y: 3.92 }), //
    new Road({ type: 0, x: 6.44, y: 4.62 }), //

    new Road({ type: 0, x: -6.44, y: -1.82 }),
    new Road({ type: 0, x: -6.44, y: -2.52 }),
    new Road({ type: 0, x: -6.44, y: -3.22 }),
    new Road({ type: 0, x: -6.44, y: -3.92 }),
    new Road({ type: 0, x: -6.44, y: -4.62 }),

    new Road({ type: 0, x: -6.44, y: 1.82 }),
    new Road({ type: 0, x: -6.44, y: 2.52 }),
    new Road({ type: 0, x: -6.44, y: 3.22 }),
    new Road({ type: 0, x: -6.44, y: 3.92 }),
    new Road({ type: 0, x: -6.44, y: 4.62, blocked: [2] }),

    new Road({ type: 0, x: -1.82, y: 6.44, r: 2 }),
    new Road({ type: 0, x: -2.52, y: 6.44, r: 2 }),
    new Road({ type: 0, x: -3.22, y: 6.44, r: 2 }),
    new Road({ type: 0, x: -3.92, y: 6.44, r: 2 }),
    new Road({ type: 0, x: -4.62, y: 6.44, r: 2 }),

    new Road({ type: 0, x: 1.82, y: 6.44, r: 2 }), //
    new Road({ type: 0, x: 2.52, y: 6.44, r: 2 }), //
    new Road({ type: 0, x: 3.22, y: 6.44, r: 2 }), //
    new Road({ type: 0, x: 3.92, y: 6.44, r: 2 }), //
    new Road({ type: 0, x: 4.62, y: 6.44, r: 2, blocked: [0] }), //

    new Road({ type: 0, x: -1.82, y: -6.44, r: 2 }),
    new Road({ type: 0, x: -2.52, y: -6.44, r: 2 }),
    new Road({ type: 0, x: -3.22, y: -6.44, r: 2 }),
    new Road({ type: 0, x: -3.92, y: -6.44, r: 2 }),
    new Road({ type: 0, x: -4.62, y: -6.44, r: 2, blocked: [2] }),

    new Road({ type: 0, x: 1.82, y: -6.44, r: 2 }),
    new Road({ type: 0, x: 2.52, y: -6.44, r: 2 }),
    new Road({ type: 0, x: 3.22, y: -6.44, r: 2 }),
    new Road({ type: 0, x: 3.92, y: -6.44, r: 2 }),
    new Road({ type: 0, x: 4.62, y: -6.44, r: 2 })
  )
  useEffect(() => {
    edgesRef.current = []
    for (let i = 0; i < roads.length; i++) {
      navigator.points.push(...roads[i].points)
    }
    navigator.generateGraph()
    if (navigator && navigator.edges) {
      edgesRef.current.push(...navigator.edges)
    }
  }, [])
  useEffect(() => {
    if (sceneRef.current) {
      edgesRef.current.forEach((edge) => {
        const path = new THREE.CatmullRomCurve3([
          new THREE.Vector3(edge.pointA.xW, 0, edge.pointA.yW),
          new THREE.Vector3(edge.pointB.xW, 0, edge.pointB.yW),
        ])

        const geometry = new THREE.TubeGeometry(path, 10, 0.02, 3, false)

        // Определите цвет в зависимости от направления
        let color
        if (edge.direction === 'AtoB') {
          color = new THREE.Color('blue') // Цвет для направления от A к B
        } else if (edge.direction === 'BtoA') {
          color = new THREE.Color('red') // Цвет для направления от B к A
        } else {
          color = new THREE.Color('black') // Цвет по умолчанию
        }

        const material = new THREE.MeshBasicMaterial({
          color: color,
          side: THREE.DoubleSide,
        })

        const tube = new THREE.Mesh(geometry, material)

        sceneRef.current.add(tube)
      })
    }
  }, [edgesRef.current])
  return (
    <group ref={sceneRef}>
      {cars.map((car, index) => (
        <group key={index}>{car.create()}</group>
      ))}
      {roads.map((road, index) => road.create(index))}
    </group>
  )
}

const App = () => {
  const { ErrorBoundary, didCatch, error } = useErrorBoundary()

  return didCatch ? (
    <div>{error.message}</div>
  ) : (
    <ErrorBoundary>
      {/* <video autoPlay loop muted playsInline>
        <source src="/assets/0001-0226.webm" type="video/webm" />
        Ваш браузер не поддерживает видео в формате WebM.
      </video> */}
      <Canvas shadowmap="true" flat dpr={[4, 6]}>
        <color attach="background" args={['lightblue']} />
        <SetupToneMapping />
        <axesHelper />
        <CameraControls
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={Math.PI / 2.3}
          minDistance={3}
          distance={30}
          maxDistance={60}
        />
        <ambientLight intensity={1} />
        <hemisphereLight
          skyColor={0xffffff}
          groundColor={0x444444}
          intensity={1.5}
        />
        <pointLight position={[5, 5, 5]} intensity={1.5} decay={2} />
        <pointLight position={[-5, 5, 5]} intensity={1.5} decay={2} />
        <pointLight position={[5, 5, -5]} intensity={1.5} decay={2} />
        <pointLight position={[-5, 5, -5]} intensity={1.5} decay={2} />
        <group scale={1} position={[0, 0, 0]}>
          <Scene />
          <Stats />
        </group>
        <PerspectiveCamera makeDefault position={[0, 2, 3]} />
      </Canvas>
    </ErrorBoundary>
  )
}

export default App
