import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GPUAllocator } from '../Renderer/GPUAllocator';

export class AssetManager {
  private gltfLoader: GLTFLoader = new GLTFLoader();
  private objLoader: OBJLoader = new OBJLoader();
  private rgbeLoader: RGBELoader = new RGBELoader();
  private textureLoader: THREE.TextureLoader = new THREE.TextureLoader();

  private modelCache: Map<string, THREE.Object3D> = new Map();
  private textureCache: Map<string, THREE.Texture> = new Map();

  // "Assimp" equivalent
  public async loadModel(url: string, id: string): Promise<THREE.Object3D> {
    if (this.modelCache.has(id)) {
        return this.modelCache.get(id)!.clone();
    }

    return new Promise((resolve, reject) => {
        if (url.endsWith('.glb') || url.endsWith('.gltf')) {
            this.gltfLoader.load(url, (gltf) => {
                this.modelCache.set(id, gltf.scene);
                
                // Track geometries/materials for memory manager
                gltf.scene.traverse(node => {
                    if (node instanceof THREE.Mesh) {
                        GPUAllocator.trackGeometry(node.geometry);
                        if (node.material) GPUAllocator.trackMaterial(node.material);
                    }
                });

                resolve(gltf.scene.clone());
            }, undefined, reject);
        } else if (url.endsWith('.obj')) {
            this.objLoader.load(url, (obj) => {
                this.modelCache.set(id, obj);
                resolve(obj.clone());
            }, undefined, reject);
        } else {
            reject(new Error("Unsupported model format"));
        }
    });
  }

  public async loadTexture(url: string, id: string): Promise<THREE.Texture> {
    if (this.textureCache.has(id)) {
        return this.textureCache.get(id)!;
    }

    return new Promise((resolve, reject) => {
        this.textureLoader.load(url, (texture) => {
            this.textureCache.set(id, texture);
            GPUAllocator.trackTexture(texture);
            resolve(texture);
        }, undefined, reject);
    });
  }

  public async loadHDRI(url: string, id: string): Promise<THREE.DataTexture> {
    if (this.textureCache.has(id)) {
        return this.textureCache.get(id) as THREE.DataTexture;
    }

    return new Promise((resolve, reject) => {
        this.rgbeLoader.load(url, (texture) => {
            this.textureCache.set(id, texture);
            GPUAllocator.trackTexture(texture);
            resolve(texture);
        }, undefined, reject);
    });
  }
}
