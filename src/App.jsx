import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Plane,
  Box,
  CameraControls,
  Fisheye,
  PerspectiveCamera,
  Stats,
  useGLTF,
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

class Road {
  constructor({ x = 0, y = 0, type = 0, points = [] }) {
    ;(this.coordinates = [x, y]),
      (this.ref = useRef()),
      (this.points = points),
      (this.type = type),
      (this.listOfTypes = [
        {
          points: [
            {
              coordinates: { x: 0, y: 0 },
              isBlocked: false,
              isTraficLight: false,
              score: 0,
              direction: false,
            },
          ],
          url: 'Road_2',
        },
        {
          points: [
            {
              coordinates: { x: 1.1, y: 0.335 },
              isBlocked: false,
              isTraficLight: false,
              score: 0,
              direction: false,
              connections: [],
            },
            {
              coordinates: { x: 1.1, y: -0.335 },
              isBlocked: false,
              isTraficLight: false,
              score: 0,
              direction: false,
              connections: [],
            },
            {
              coordinates: { x: -1.1, y: 0.335 },
              isBlocked: false,
              isTraficLight: false,
              score: 0,
              direction: false,
              connections: [],
            },
            {
              coordinates: { x: -1.1, y: -0.335 },
              isBlocked: false,
              isTraficLight: false,
              score: 0,
              direction: false,
              connections: [],
            },
            {
              coordinates: { x: 0.335, y: 1.1 },
              isBlocked: false,
              isTraficLight: false,
              score: 0,
              direction: false,
              connections: [],
            },
            {
              coordinates: { x: 0.335, y: -1.1 },
              isBlocked: false,
              isTraficLight: false,
              score: 0,
              direction: false,
              connections: [],
            },
            {
              coordinates: { x: -0.335, y: 1.1 },
              isBlocked: false,
              isTraficLight: false,
              score: 0,
              direction: false,
              connections: [],
            },
            {
              coordinates: { x: -0.335, y: -1.1 },
              isBlocked: false,
              isTraficLight: false,
              score: 0,
              direction: false,
              connections: [],
            },
            {
              coordinates: { x: 0.4, y: 0.4 },
              isBlocked: false,
              isTraficLight: false,
              score: 0,
              direction: false,
              connections: [],
            },
            {
              coordinates: { x: 0.4, y: -0.4 },
              isBlocked: false,
              isTraficLight: false,
              score: 0,
              direction: false,
              connections: [],
            },
            {
              coordinates: { x: -0.4, y: 0.4 },
              isBlocked: false,
              isTraficLight: false,
              score: 0,
              direction: false,
              connections: [],
            },
            {
              coordinates: { x: -0.4, y: -0.4 },
              isBlocked: false,
              isTraficLight: false,
              score: 0,
              direction: false,
              connections: [],
            },
          ],
          url: 'Road_Crossroads_1',
        },
      ])
  }
  create() {
    const { nodes, materials } = useGLTF(
      `/assets/Roads/${this.listOfTypes[this.type].url}.gltf`
    )

    return (
      <group ref={this.ref}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes[this.listOfTypes[this.type].url].geometry}
          material={materials.Mat}
          scale={0.07}
        />
        {this.debug()}
      </group>
    )
  }
  debug() {
    console.log('Debug enabled on Roads', this.listOfTypes[this.type].points)

    return this.listOfTypes[this.type].points.map((p, index) => (
      <mesh position={[p.coordinates.x, 0, p.coordinates.y]} key={index}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="red" />
      </mesh>
    ))
  }
}

class Car {
  constructor() {
    ;(this.coordinates = [0, 0]),
      (this.garageID = 0),
      (this.ref = useRef()),
      (this.speed = 60),
      (this.progress = 1),
      (this.path = []),
      (this.curve = useRef(new THREE.CurvePath())),
      (this.curveRef = useRef()),
      (this.curveRefOld = useRef())
  }
  create() {
    useFrame(() => {
      // this.move()
    })
    const { nodes, materials } = useGLTF('/assets/Vehicles/Truck_2.gltf')

    return (
      <>
        <group ref={this.ref}>
          <mesh
            rotation={[0, Math.PI / 2, 0]}
            castShadow
            receiveShadow
            geometry={nodes.Truck_2.geometry}
            material={materials.Mat}
            scale={0.07}
          >
            {/* <pointLight
              position={[0.15, 0.2, 0.3]}
              intensity={1}
              distance={2}
            />
            <pointLight
              position={[-0.15, 0.2, 0.3]}
              intensity={1}
              distance={2}
            /> */}
          </mesh>
        </group>
        <mesh ref={this.curveRef}>
          <bufferGeometry />
          <meshStandardMaterial color={'#000917'} transparent opacity={0.8} />
        </mesh>
        <mesh ref={this.curveRefOld}>
          <bufferGeometry />
          <meshStandardMaterial color={'#003180'} transparent opacity={0.8} />
        </mesh>
      </>
    )
  }
  move() {
    if (this.ref.current && this.curve) {
      this.progress += 0.001
      if (this.progress > 1) {
        this.curve = this.generateRoute()
        this.progress = 0
      }
      const point = this.curve.getPoint(this.progress)
      let oldCurve = []
      let newCurve = []
      for (let i = 0; i < 999; i++) {
        if (Math.round(this.progress * 1000) <= i) {
          oldCurve.push(this.curve.points[i])
        } else {
          newCurve.push(this.curve.points[i])
        }
      }
      if (newCurve.length > 1) {
        newCurve = new THREE.CatmullRomCurve3(newCurve)
        this.curveRef.current.geometry = new THREE.TubeGeometry(
          newCurve,
          newCurve.points.length * 2,
          0.025,
          6,
          false
        )
      }
      if (oldCurve.length > 1) {
        oldCurve = new THREE.CatmullRomCurve3(oldCurve)
        this.curveRefOld.current.geometry = new THREE.TubeGeometry(
          oldCurve,
          oldCurve.points.length * 2,
          0.025,
          6,
          false
        )
      }
      const nextPoint = this.curve.getPoint(this.progress + 0.001)
      nextPoint.y = 0
      this.setCoordinatesXY(point.x, point.z)
      this.ref.current.lookAt(nextPoint)
    }
  }
  setCoordinatesXY(x = 0, y = 0) {
    this.ref.current.position.set(x, 0, y)
  }
  getCoordinatesXY() {
    const x = this.ref.current.position.x
    const y = this.ref.current.position.z
    return { x, y }
  }
  generateRoute() {
    const XMax = 5
    const YMax = 5
    const XMin = -5
    const YMin = -5
    const points = []
    const getRandomNum = (max = 1, min = 0) => {
      return Math.random() * (max - min) + min
    }
    if (this.curve.points) {
      points.push(
        new THREE.Vector2(
          this.curve.points[this.curve.points.length - 1].x,
          this.curve.points[this.curve.points.length - 1].z
        )
      )
    }
    for (let i = 0; i < Math.floor(getRandomNum(10, 20)); i++) {
      points.push(
        new THREE.Vector2(getRandomNum(XMax, XMin), getRandomNum(YMax, YMin))
      )
    }
    const path = new THREE.CatmullRomCurve3(
      points.map((point) => new THREE.Vector3(point.x, 0, point.y))
    )
    path.points = path.getPoints(999)
    return path
  }
}
const Scene = () => {
  const cars = []
  cars.push(new Car())
  const roads = []
  roads.push(new Road({ type: 1, coordinates: [0, 0] }))
  return (
    <>
      ({cars[0].create()}) ({roads[0].create()})
    </>
  )
}

const App = () => {
  const { ErrorBoundary, didCatch, error } = useErrorBoundary()

  return didCatch ? (
    <div>{error.message}</div>
  ) : (
    <ErrorBoundary>
      <Canvas shadowmap="true" flat dpr={[2, 4]}>
        {/* <OrbitControls /> */}
        <Fisheye zoom={0}>
          <color attach="background" args={['lightblue']} />
          <SetupToneMapping />
          <axesHelper />
          <CameraControls
          // minPolarAngle={Math.PI / 5}
          // maxPolarAngle={Math.PI / 2.3}
          // minDistance={2}
          // maxDistance={15}
          />
          <ambientLight intensity={1} />

          {/* Полосы света для освещения со всех сторон */}
          <hemisphereLight
            skyColor={0xffffff} // Цвет верхнего света
            groundColor={0x444444} // Цвет нижнего света
            intensity={1.5}
          />

          {/* Несколько точечных источников света */}
          <pointLight position={[5, 5, 5]} intensity={1.5} decay={2} />
          <pointLight position={[-5, 5, 5]} intensity={1.5} decay={2} />
          <pointLight position={[5, 5, -5]} intensity={1.5} decay={2} />
          <pointLight position={[-5, 5, -5]} intensity={1.5} decay={2} />
          <group scale={1} position={[0, 0, 0]}>
            <Scene />
            <Stats />
          </group>
          <PerspectiveCamera makeDefault position={[0, 2, 3]} />
        </Fisheye>
      </Canvas>
    </ErrorBoundary>
  )
}

export default App
