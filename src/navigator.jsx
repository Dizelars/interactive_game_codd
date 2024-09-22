import * as THREE from 'three'
export class Navigator {
  constructor() {
    this.points = []
    this.graph = []
    this.edges = []
    this.debug = false
  }
  getRandomEdgePoint() {
    const edges = this.edges.filter(
      (edge) => edge.pointA.type && edge.pointA.type == 'road'
    )

    return edges[Math.floor(this.getRandomNum(edges.length))]
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
            calculateDistance(point, pointA) < 2.3 &&
            point.type != 'road'
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
            // direction: 'AtoB',
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
    const updateDirections = (lines, startLine, direction) => {
      const stack = [startLine]
      const visitedEdges = new Set()
      const visitedPoints = new Set()

      while (stack.length > 0) {
        const currentLine = stack.pop()

        if (visitedEdges.has(currentLine)) continue
        visitedEdges.add(currentLine)

        // Обновляем направление для текущего ребра
        if (!currentLine.direction) {
          currentLine.direction = direction
          lines[currentLine.index] = currentLine // Обновляем в исходном массиве
        }

        // Определяем точку, в которую нужно искать соседей
        const searchPoint =
          direction === 'AtoB' ? currentLine.pointB : currentLine.pointA

        // Получаем соседние рёбра
        const neighbors = lines.filter(
          (line) =>
            (line.pointA === searchPoint &&
              line.pointB !==
                (direction === 'AtoB'
                  ? currentLine.pointA
                  : currentLine.pointB)) ||
            (line.pointB === searchPoint &&
              line.pointA !==
                (direction === 'AtoB'
                  ? currentLine.pointB
                  : currentLine.pointA))
        )

        // Добавляем соседние рёбра в стек для последующей обработки
        neighbors.forEach((neighbor) => {
          if (!visitedEdges.has(neighbor)) {
            stack.push(neighbor)
          }
        })
      }
    }
    const processLines = (lines) => {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const { pointA, pointB, twoWay } = line

        if (pointA.direction || pointB.direction || twoWay) {
          let initialDirection = null

          if (pointA.direction === true) {
            initialDirection = 'AtoB'
          } else if (pointB.direction === true) {
            initialDirection = 'BtoA'
          }

          if (initialDirection) {
            // Обновляем направления по линии
            updateDirections(lines, line, initialDirection)

            // Если линия двухсторонняя, обновляем направление и в обратную сторону
            if (twoWay) {
              updateDirections(
                lines,
                line,
                initialDirection === 'AtoB' ? 'BtoA' : 'AtoB'
              )
            }
          } else if (twoWay) {
            // Если нет начального направления, но есть twoWay, обрабатываем обе стороны
            updateDirections(lines, line, 'AtoB')
            updateDirections(lines, line, 'BtoA')
          }
        }
      }
    }
    const buildGraph = (lines) => {
      const graph = new Map()

      lines.forEach((edge) => {
        const { distance, pointA, pointB, direction, twoWay } = edge

        const keyA = this.serializePoint({ x: pointA.xW, y: pointA.yW })
        const keyB = this.serializePoint({ x: pointB.xW, y: pointB.yW })

        // Инициализация вершин в графе, если их еще нет
        if (!graph.has(keyA)) {
          graph.set(keyA, [])
        }
        if (!graph.has(keyB)) {
          graph.set(keyB, [])
        }

        // Добавляем рёбра в зависимости от направления и параметра twoWay
        if (direction === 'AtoB' || twoWay) {
          graph.get(keyA).push({ point: keyB, distance })
        }

        if (direction === 'BtoA' || twoWay) {
          graph.get(keyB).push({ point: keyA, distance })
        }
      })

      return graph
    }
    const buildLines = () => {
      for (let i = 0; i < points.length; i++) {
        const pointA = points[i]
        for (let j = 0; j < points.length; j++) {
          if (i === j) continue
          const pointB = points[j]
          const distance = calculateDistance(pointA, pointB)
          const hasDirectionA = pointA.hasOwnProperty('direction')
          const hasDirectionB = pointB.hasOwnProperty('direction')
          const isXRoadTile =
            ((pointA.y == pointB.y ||
              (pointA.y != pointB.y && pointA.y < 0 && pointB.y < 0) ||
              (pointA.y != pointB.y && pointA.y > 0 && pointB.y > 0)) &&
              pointA.x == 0 &&
              pointB.x == 0) ||
            ((pointA.x == pointB.x ||
              (pointA.x != pointB.x && pointA.x < 0 && pointB.x < 0) ||
              (pointA.x != pointB.x && pointA.x > 0 && pointB.x > 0)) &&
              pointA.y == 0 &&
              pointB.y == 0)

          // Определение "одинаковой стороны"
          const sameSide =
            hasDirectionA || hasDirectionB
              ? pointA.x == pointB.x || pointA.y == pointB.y
              : isXRoadTile

          if (distance > 0.69 && distance < 0.8 && sameSide) {
            lines.push({ indexA: i, indexB: j, distance, pointA, pointB })
          }
        }
      }
    }
    const buildLinesWithConnections = () => {
      const linesWithConnections = lines.filter(
        (line) =>
          line.pointA.connections.length > 0 ||
          line.pointB.connections.length > 0
      )
      for (let i = 0; i < linesWithConnections.length; i++) {
        const line = linesWithConnections[i]
        const { pointA, pointB } = line

        if (pointA.connections.length > 0) {
          loadConnectedPoints(pointA)
        } else if (pointB.connections.length > 0) {
          loadConnectedPoints(pointB)
        }
      }
    }
    buildLines()
    lines = removeDublicates(lines)
    buildLinesWithConnections()

    processLines(lines)
    lines = removeDublicates(lines)

    this.edges = [...lines]
    return (this.graph = buildGraph(this.edges))
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
  getRandomNum(max, min = 0) {
    return Math.random() * (max - min) + min
  }
}
