import { loader, MeshLOD } from './meshLOD'
import React, { useRef, useEffect } from 'react'
import { Detailed, Box, Cone } from '@react-three/drei'
import * as THREE from 'three'
export class Car extends MeshLOD {
  constructor({
    navigator = Navigator,
    coordinates = { x: 0, y: 0 },
    gltfURL = '/Vehicles/Truck_2',
    debug = false,
    wheelsPosition = [
      { x: 0.153, y: 0.0363, z: 0.09 }, // зданее левое
      { x: 0.153, y: 0.0363, z: -0.09 }, // зданее правое
      { x: -0.17, y: 0.0363, z: 0.09 }, // переднее левое
      { x: -0.17, y: 0.0363, z: -0.09 }, // переднее правое
    ],
    lightsPosition = [
      [-6.9, 0, 1.15], // левая
      [-6.9, 0, -1.15], // паравая
    ],
    interactionColider = {
      args: [0.6, 0.3, 0.3],
      position: [0, 0.15, 0],
    },
    actionColider = {
      args: [0.15, 0.2, 0.1],
      position: [-0.38, 0.15, 0],
    },
    visualColider = {
      args: [3, 3, 3],
      position: [0, 0, 0],
    },
    speed = 1,
    maxSpeed = 1,
  }) {
    super({ gltfURL, rotation: [Math.PI / 2, 0, 0] })
    this.ref = useRef()
    this.coordinates = coordinates
    this.navigator = navigator
    this.debug = debug
    this.wheels = []
    this.wheelsPosition = wheelsPosition
    this.lightsPosition = lightsPosition
    this.interactionColiderRef = useRef()
    this.actionColiderRef = useRef()
    this.visualColiderRef = useRef()
    this.interactionColider = interactionColider
    this.actionColider = actionColider
    this.visualColider = visualColider
    this.canMove = true
    this.isVisible = true
    this.speed = speed
    this.maxSpeed = maxSpeed
    this.progress = 1
    this.lastTime = performance.now()
    this.lastPoint = undefined
    this.curve = undefined
    this.curveRef = useRef()
    this.curveRefOld = useRef()
  }
  create(key) {
    useEffect(() => {
      if (this.actionColiderRef.current && this.interactionColiderRef.current) {
        this.actionColider.colider = new THREE.Box3().setFromObject(
          this.actionColiderRef.current
        )
        this.interactionColider.colider = new THREE.Box3().setFromObject(
          this.interactionColiderRef.current
        )
      }
    }, [this.actionColiderRef.current, this.interactionColiderRef.current])
    return (
      <>
        <group
          ref={this.ref}
          key={`car-${key}`}
          visible={this.isVisible}
          position={[this.coordinates.x, 0, this.coordinates.y]}
        >
          <group rotation={[0, Math.PI / 2, 0]}>
            {this.LOD()}
            {this.setupWheels()}
            <Box
              visible={this.debug}
              ref={this.interactionColiderRef}
              args={this.interactionColider.args}
              position={this.interactionColider.position}
              onClick={() => console.log('Клик по машине')}
            >
              <meshBasicMaterial wireframe />
            </Box>
            <Box
              visible={this.debug}
              ref={this.actionColiderRef}
              args={this.actionColider.args}
              position={this.actionColider.position}
            >
              <meshBasicMaterial wireframe />
            </Box>
            <Box
              visible={this.debug}
              ref={this.visualColiderRef}
              args={this.visualColider.args}
              position={this.visualColider.position}
            >
              <meshBasicMaterial wireframe />
            </Box>
            {this.setupLights()}
          </group>
        </group>
        <mesh ref={this.curveRef} key={`car-path-${key}`}>
          <bufferGeometry />
          <meshStandardMaterial color={'#000917'} />
        </mesh>
        <mesh ref={this.curveRefOld} key={`car-path-old-${key}`}>
          <bufferGeometry />
          <meshStandardMaterial color={'#003180'} />
        </mesh>
      </>
    )
  }
  setupLights() {
    const texture = loader.textures.gradientTexture
    const lightStrength = this.navigator.getRandomNum(0.3, 0.05)
    return (
      <Detailed distances={this.distances}>
        {this.distances.map((distance, index) => {
          if (this.distances.length - 1 == index)
            return <group key={index} scale={0.07} />
          return (
            <group key={index} scale={0.07}>
              <Cone
                args={[2, 10, 6 - index]}
                position={this.lightsPosition[0]}
                rotation={[0, 0, Math.PI / -2.6]}
              >
                <meshStandardMaterial
                  map={texture}
                  transparent={true}
                  opacity={lightStrength}
                />
              </Cone>
              <Cone
                args={[2, 10, 6 - index]}
                position={this.lightsPosition[1]}
                rotation={[0, 0, Math.PI / -2.6]}
              >
                <meshStandardMaterial
                  map={texture}
                  transparent={true}
                  opacity={lightStrength}
                />
              </Cone>
            </group>
          )
        })}
      </Detailed>
    )
  }
  setupWheels() {
    this.wheelsPosition.map((wheel, index) => {
      this.wheels.push(
        new MeshLOD({
          gltfURL: '/Vehicles/Wheel',
          ...wheel,
          rotation: index % 2 == 0 ? [0, 0, 0] : [0, 3.14, 0],
        })
      )
    })
    return <group>{this.wheels.map((wheel, index) => wheel.LOD(index))}</group>
  }
  move() {
    if (this.canMove && this.navigator.edges.length > 0) {
      const currentTime = performance.now()
      const deltaTime = (currentTime - this.lastTime) / 1000 // время в секундах
      this.lastTime = currentTime
      if (!this.curve) {
        if (this.lastPoint) {
          const point = this.navigator.getRandomEdgePoint().pointA
          this.curve = this.navigator.generateRoute(
            { x: this.lastPoint.x, y: this.lastPoint.y },
            { x: point.x, y: point.z }
          ).curve
        } else {
          console.log(this.lastPoint)
          this.curve = this.navigator.generateRandomRoute().curve
        }
      }
      if (this.curve.points.length < 2) return (this.curve = undefined)
      // console.log(this.curve)
      // Расчитываем перемещение на основе скорости и времени
      const distancePerFrame = this.speed * deltaTime
      const newProgress =
        this.speed == 0
          ? 0
          : this.progress + distancePerFrame / this.curve.getLength()

      // Если достигли конца кривой, вернемся к началу
      if (newProgress >= 1) {
        this.progress = 0
        const point = this.navigator.getRandomEdgePoint().pointA
        this.lastPoint = this.curve.getPoint(1)

        console.log(this.lastPoint)
        this.curve = this.navigator.generateRoute(
          { x: this.lastPoint.x, y: this.lastPoint.y },
          { x: point.x, y: point.z }
        ).curve
      } else {
        this.progress = newProgress
      }
      const updateCurveGeometry = (ref, points) => {
        if (points.length > 1) {
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

      // Устанавливаем позицию объекта по кривой
      if (this.ref.current && this.progress > 0) {
        const point = this.curve.getPoint(this.progress)
        const nextPoint = this.curve.getPoint(this.progress + 0.001)

        this.ref.current.lookAt(nextPoint)
        this.ref.current.position.set(point.x, point.y, point.z)
        const numPoints = this.curve.points.length
        const progressRatio = this.progress * numPoints
        const threshold = Math.floor(progressRatio)
        const oldCurve = this.curve.points.slice(0, threshold)
        const newCurve = this.curve.points.slice(threshold)
        updateCurveGeometry(this.curveRef.current, oldCurve)
        updateCurveGeometry(this.curveRefOld.current, newCurve)
        for (let i = 0; i < this.wheels.length; i++) {
          if (i == 2) {
            // this.wheels[i].lodRef.current.rotation.y =
            //   Math.abs(this.ref.current.rotation.y) > Math.PI / 4
            //     ? Math.PI / 4
            //     : this.ref.current.rotation.y
          } else if (i == 3) {
            // this.wheels[i].lodRef.current.rotation.y =
            //   Math.abs(this.ref.current.rotation.y - Math.PI) > Math.PI / 4
            //     ? Math.PI / 4 - Math.PI
            //     : this.ref.current.rotation.y - Math.PI
          }
          if (
            this.wheels[i].lodRef.current.rotation.z <= -6.28 ||
            this.wheels[i].lodRef.current.rotation.z >= 6.28
          )
            this.wheels[i].lodRef.current.rotation.z = 0

          if (i % 2 != 0) {
            this.wheels[i].lodRef.current.rotation.z -= this.speed / 2
          } else {
            this.wheels[i].lodRef.current.rotation.z += this.speed / 2
          }
        }
      }
    }
  }
}
