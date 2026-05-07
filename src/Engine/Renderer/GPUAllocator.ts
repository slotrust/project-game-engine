import * as THREE from 'three';

export class GPUAllocator {
    private static totalAllocatedGeometries = 0;
    private static totalAllocatedTextures = 0;
    private static totalAllocatedMaterials = 0;

    // Simulating descriptor pools / memory tracking for WebGL/WebGPU
    public static trackGeometry(geometry: THREE.BufferGeometry) {
        this.totalAllocatedGeometries++;
        geometry.addEventListener('dispose', () => {
            this.totalAllocatedGeometries--;
        });
    }

    public static trackTexture(texture: THREE.Texture) {
        this.totalAllocatedTextures++;
        texture.addEventListener('dispose', () => {
            this.totalAllocatedTextures--;
        });
    }

    public static trackMaterial(material: THREE.Material) {
        this.totalAllocatedMaterials++;
        material.addEventListener('dispose', () => {
            this.totalAllocatedMaterials--;
        });
    }

    public static getStats() {
        return {
            geometries: this.totalAllocatedGeometries,
            textures: this.totalAllocatedTextures,
            materials: this.totalAllocatedMaterials,
             // Approximation of memory usage based on type sizes
            vramEstimateMB: (this.totalAllocatedTextures * 16) + (this.totalAllocatedGeometries * 2),
        };
    }

    public static disposeObjectHierarchy(obj: THREE.Object3D) {
        obj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
    }
}
