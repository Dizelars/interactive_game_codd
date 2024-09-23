import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  CameraControls,
  PerspectiveCamera,
  useTexture,
} from '@react-three/drei'
import * as THREE from 'three'
import { loader, MeshLOD } from './meshLOD'
import { Navigator } from './navigator'
import { Car } from './car'
import { CrossroadX, RoadPiece, RoadPiece90, Turn, CrossroadT } from './road'
export const Scene = ({ debug = false }) => {
  const sceneRef = useRef()
  const cars = []
  const grid = []
  const cameraRef = useRef()
  const cameraControlsRef = useRef()
  let edgesRef = useRef([])
  loader.textures.gradientTexture = useTexture([
    '/assets/gradient_texture.png',
  ]).gradientTexture
  const navigator = new Navigator()

  for (let i = 0; i < 30; i++) {
    const speed = 1
    // const speed = navigator.getRandomNum(1.1, 0.3)
    cars.push(new Car({ navigator, debug, speed: speed, maxSpeed: speed }))
  }
  const crossroads = 3
  const roads = 5
  const rouder = (value) => {
    return Math.round(value * 1000) / 1000
  }

  for (let i = 0; i < crossroads; i++) {
    for (let j = 0; j < crossroads; j++) {
      if (i == 0 && j == 0) {
        grid.push(
          new Turn({
            x: rouder((1.82 * 2 + 0.7 * (roads - 1)) * i),
            y: rouder((1.82 * 2 + 0.7 * (roads - 1)) * j),
            rotation: [0, 0, 0],
            debug,
          })
        )
      } else if (i == crossroads - 1 && j == crossroads - 1) {
        grid.push(
          new Turn({
            x: rouder((1.82 * 2 + 0.7 * (roads - 1)) * i),
            y: rouder((1.82 * 2 + 0.7 * (roads - 1)) * j),
            rotation: [0, Math.PI, 0],
            debug,
          })
        )
      } else if (i == 0 && j == crossroads - 1) {
        grid.push(
          new Turn({
            x: rouder((1.82 * 2 + 0.7 * (roads - 1)) * i),
            y: rouder((1.82 * 2 + 0.7 * (roads - 1)) * j),
            rotation: [0, Math.PI / 2, 0],
            debug,
          })
        )
      } else if (i == crossroads - 1 && j == 0) {
        grid.push(
          new Turn({
            x: rouder((1.82 * 2 + 0.7 * (roads - 1)) * i),
            y: rouder((1.82 * 2 + 0.7 * (roads - 1)) * j),
            rotation: [0, Math.PI * 1.5, 0],
            debug,
          })
        )
      } else if (i == 0 && j != 0 && j != crossroads - 1) {
        grid.push(
          new CrossroadT({
            x: rouder((1.82 * 2 + 0.7 * (roads - 1)) * i),
            y: rouder((1.82 * 2 + 0.7 * (roads - 1)) * j),
            rotation: [0, Math.PI / 2, 0],
            debug,
          })
        )
      } else if (j == 0 && i != 0 && i != crossroads - 1) {
        grid.push(
          new CrossroadT({
            x: rouder((1.82 * 2 + 0.7 * (roads - 1)) * i),
            y: rouder((1.82 * 2 + 0.7 * (roads - 1)) * j),
            rotation: [0, 0, 0],
            debug,
          })
        )
      } else if (i == crossroads - 1 && j != 0 && j != crossroads - 1) {
        grid.push(
          new CrossroadT({
            x: rouder((1.82 * 2 + 0.7 * (roads - 1)) * i),
            y: rouder((1.82 * 2 + 0.7 * (roads - 1)) * j),
            rotation: [0, Math.PI * 1.5, 0],
            debug,
          })
        )
      } else if (j == crossroads - 1 && i != 0 && i != crossroads - 1) {
        grid.push(
          new CrossroadT({
            x: rouder((1.82 * 2 + 0.7 * (roads - 1)) * i),
            y: rouder((1.82 * 2 + 0.7 * (roads - 1)) * j),
            rotation: [0, Math.PI, 0],
            debug,
          })
        )
      } else {
        grid.push(
          new CrossroadX({
            x: rouder((1.82 * 2 + 0.7 * (roads - 1)) * i),
            y: rouder((1.82 * 2 + 0.7 * (roads - 1)) * j),
            debug,
          })
        )
      }
      if (i < crossroads - 1 && j < crossroads)
        for (let k = 0; k < roads; k++) {
          grid.push(
            new RoadPiece90({
              x: rouder((1.82 * 2 + 0.7 * (roads - 1)) * i + 1.82 + k * 0.7),
              y: rouder((1.82 * 2 + 0.7 * (roads - 1)) * j),
              debug,
            })
          )
        }
      if (i < crossroads && j < crossroads - 1)
        for (let k = 0; k < roads; k++) {
          grid.push(
            new RoadPiece({
              x: rouder((1.82 * 2 + 0.7 * (roads - 1)) * i),
              y: rouder((1.82 * 2 + 0.7 * (roads - 1)) * j + 1.82 + k * 0.7),
              debug,
            })
          )
        }
    }
  }
  //   console.log(roads)

  useEffect(() => {
    edgesRef.current = []
    for (let i = 0; i < grid.length; i++) {
      navigator.points.push(...grid[i].points)
    }
    navigator.generateGraph()

    if (debug) {
      if (navigator && navigator.edges) {
        edgesRef.current.push(...navigator.edges)
      }
    }
  }, [])
  if (debug) {
    useEffect(() => {
      if (sceneRef.current) {
        edgesRef.current.forEach((edge) => {
          const path = new THREE.CatmullRomCurve3([
            new THREE.Vector3(edge.pointA.xW, 0, edge.pointA.yW),
            new THREE.Vector3(edge.pointB.xW, 0, edge.pointB.yW),
          ])
          const geometry = new THREE.TubeGeometry(path, 1, 0.02, 3, false)
          // let color
          // if (edge.direction === 'AtoB') color = new THREE.Color('blue')
          // else if (edge.direction === 'BtoA') color = new THREE.Color('red')
          // else color = new THREE.Color('black')

          const color = new THREE.Color('blue')

          const material = new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.DoubleSide,
          })

          const tube = new THREE.Mesh(geometry, material)

          sceneRef.current.add(tube)
        })
      }
    }, [edgesRef.current])
  }
  let frameCounter = 0
  useFrame(() => {
    frameCounter++
    if (frameCounter == 1) {
      const position = 1.82 * 2 + 0.7 * (roads - 1)
      cameraControlsRef.current.setTarget(position, 0, position)
      cameraControlsRef.current.setPosition(position, 0, position + 1)
      cameraControlsRef.current.polarAngle = Math.PI / 3.5
      cameraControlsRef.current.distance = 5
    }
    if (frameCounter % 2 == 0) {
      for (let i = 0; i < cars.length; i++) {
        for (let j = 0; j < cars.length; j++) {
          if (j == i) continue
          cars[i].actionColider.colider = new THREE.Box3().setFromObject(
            cars[i].actionColiderRef.current
          )
          cars[j].interactionColider.colider = new THREE.Box3().setFromObject(
            cars[j].interactionColiderRef.current
          )
          if (
            cars[i].actionColider.colider.intersectsBox(
              cars[j].interactionColider.colider
            ) &&
            cars[i].curve
          ) {
            cars[i].speed -= navigator.getRandomNum(0.3, 0.2)
            // if (cars[i].speed < cars[j].speed - 0.2)
            //   cars[i].speed = cars[j].speed - 0.2
            if (cars[i].speed < 0) cars[i].speed = 0
          } else {
            cars[i].speed += navigator.getRandomNum(0.008, 0.003)
            if (cars[i].speed > cars[i].maxSpeed)
              cars[i].speed = cars[i].maxSpeed
          }
        }
        cars[i].move()
      }
    }
  })
  return (
    <group ref={sceneRef}>
      <CameraControls
        ref={cameraControlsRef}
        verticalDragToForward={true}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI / 3.5}
        minDistance={2}
        maxDistance={25}
      />
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
      />
      {cars.map((car, index) => car.create(index))}
      {grid.map((road, index) => road.create(index))}
    </group>
  )
}
