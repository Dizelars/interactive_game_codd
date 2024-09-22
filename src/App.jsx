import React from 'react'
import { Canvas } from '@react-three/fiber'
import { Stats, AdaptiveDpr } from '@react-three/drei'
import { useErrorBoundary } from 'use-error-boundary'
import * as THREE from 'three'
import { Scene } from './scene'

const App = () => {
  const { ErrorBoundary, didCatch, error } = useErrorBoundary()
  const debug = true
  return didCatch ? (
    <div>{error.message}</div>
  ) : (
    <ErrorBoundary>
      {/* <video autoPlay loop muted playsInline>
        <source src="/assets/0001-0226.webm" type="video/webm" />
        Ваш браузер не поддерживает видео в формате WebM.
      </video> */}
      <Canvas
        shadowmap="true"
        flat
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 2,
          powerPreference: 'high-performance',
          outputColorSpace: 'srgb',
          antialias: true,
        }}
        dpr={[0, 6]}
        onContextMenu={(event) => event.preventDefault()}
      >
        <color attach="background" args={['lightblue']} />
        <AdaptiveDpr pixelated />
        <group scale={1} position={[0, 0, 0]}>
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
          <Scene debug={debug} />
          {debug ? <axesHelper /> : ''}
          {debug ? <Stats /> : <Stats />}
        </group>
      </Canvas>
    </ErrorBoundary>
  )
}

export default App
