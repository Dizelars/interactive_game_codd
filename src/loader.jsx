import { useGLTF } from '@react-three/drei'
export class Loader {
  constructor() {
    this.models = {}
    this.textures = {}
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
    if (url.length == 0) return false
    return !!this.models[url]
  }
}
