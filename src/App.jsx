import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Plane, Box, OrbitControls } from '@react-three/drei'
import { useErrorBoundary } from 'use-error-boundary'
import * as THREE from 'three'

const App = () => {
  const { ErrorBoundary, didCatch, error } = useErrorBoundary()

  const Scene = () => {
    const carRef = useRef()
    const curveRef = useRef(new THREE.CurvePath())

    useEffect(() => {
      const points = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(-2, -2),
        new THREE.Vector2(-2, 0),
        new THREE.Vector2(-1.5, 0),
        new THREE.Vector2(-1.5, 0.5),
        new THREE.Vector2(-1.5, 2),
        new THREE.Vector2(1, 2),
        new THREE.Vector2(1, 1.5),
        new THREE.Vector2(1.5, 2),
        new THREE.Vector2(1.5, -2),
        new THREE.Vector2(0, 0),
      ]
      const curve = new THREE.CatmullRomCurve3(
        points.map((p) => new THREE.Vector3(p.x, 0, p.y))
      )
      curveRef.current = curve
    }, [])

    let t = 0

    useFrame(() => {
      if (carRef.current) {
        t += 0.001 // чем больше тем быстрее машина едет
        if (t > 1) t = 0

        const point = curveRef.current.getPoint(t)
        const nextPoint = curveRef.current.getPoint(t + 0.01)

        carRef.current.position.set(point.x, point.y, point.z)
        carRef.current.lookAt(nextPoint)
      }
    })

    return (
      <>
        <Box args={[0.2, 0.2, 0.3]} ref={carRef} castShadow>
          <meshStandardMaterial color={'#222222'} />
          <pointLight position={[0.15, 0.1, 0.3]} intensity={1} distance={2} />
          <pointLight position={[-0.15, 0.1, 0.3]} intensity={1} distance={2} />
        </Box>

        <Plane
          args={[5, 5]}
          rotation={[Math.PI * 3.5, 0, 0]}
          position={[0, -0.1, 0]}
          receiveShadow
        >
          <meshStandardMaterial color={'#444444'} />
        </Plane>
        <ambientLight intensity={10} />
      </>
    )
  }

  return didCatch ? (
    <div>{error.message}</div>
  ) : (
    <ErrorBoundary>
      <Canvas camera={{ fov: 70, position: [0, 2, 3] }} shadowmap="true">
        <OrbitControls />
        <Scene />
        <axesHelper />
      </Canvas>
    </ErrorBoundary>
  )
}

export default App
