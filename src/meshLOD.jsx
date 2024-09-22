import React, { useRef } from 'react'
import { Loader } from './loader'
import { Detailed } from '@react-three/drei'
const loader = new Loader()
class MeshLOD {
  constructor({
    x = 0,
    y = 0,
    z = 0,
    rotation = [0, 0, 0],
    gltfURL = '/Roads/Road_2',
    distances = [2, 7, 10, 15],
  }) {
    this.x = x
    this.y = y
    this.z = z
    this.rotation = rotation
    this.gltfURL = `/assets${gltfURL}`
    this.distances = distances
    this.lodRef = useRef()
  }
  LOD(key = undefined) {
    const getGeometry = (lod) => {
      return lod.nodes[this.gltfURL.split('/').slice(-1)].geometry
    }
    const LOD = [
      getGeometry(loader.get(`${this.gltfURL}.gltf`)),
      getGeometry(loader.get(`${this.gltfURL}-0.7.gltf`)),
      getGeometry(loader.get(`${this.gltfURL}-0.5.gltf`)),
      getGeometry(loader.get(`${this.gltfURL}-0.2.gltf`)),
    ]
    const modelMaterials = loader.get(`${this.gltfURL}.gltf`).materials

    const material = modelMaterials[Object.keys(modelMaterials)[0]]
    return (
      <Detailed
        distances={this.distances}
        key={key}
        position={[this.x, this.y, this.z]}
        rotation={this.rotation}
        scale={0.07}
        ref={this.lodRef}
      >
        {this.distances.map((distance, index) => (
          <mesh
            key={index}
            castShadow
            receiveShadow
            geometry={LOD[index]}
            distance={distance}
            material={material}
          />
        ))}
      </Detailed>
    )
  }
}
export { loader, MeshLOD }
