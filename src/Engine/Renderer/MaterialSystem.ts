import * as THREE from 'three';

export interface PBRMaterialConfig {
  color?: THREE.ColorRepresentation;
  map?: THREE.Texture;
  normalMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  metalnessMap?: THREE.Texture;
  aoMap?: THREE.Texture;
  emissiveMap?: THREE.Texture;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  envMapIntensity?: number;
  transparent?: boolean;
  opacity?: number;
}

export class MaterialSystem {
  private materials: Map<string, THREE.Material> = new Map();

  // Simple runtime shader compiler representation
  public createCustomShaderMaterial(id: string, vertexShader: string, fragmentShader: string, uniforms: {[key: string]: THREE.IUniform} = {}): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      lights: true // Enable lighting integration
    });
    this.materials.set(id, material);
    return material;
  }

  // PBR Material generator (Unreal style setup)
  public createPBRMaterial(id: string, config: PBRMaterialConfig): THREE.MeshPhysicalMaterial {
    const material = new THREE.MeshPhysicalMaterial({
      color: config.color !== undefined ? config.color : 0xffffff,
      roughness: config.roughness !== undefined ? config.roughness : 0.5,
      metalness: config.metalness !== undefined ? config.metalness : 0.0,
      envMapIntensity: config.envMapIntensity !== undefined ? config.envMapIntensity : 1.0,
      transparent: config.transparent || false,
      opacity: config.opacity !== undefined ? config.opacity : 1.0,
      emissive: config.emissive !== undefined ? config.emissive : 0x000000,
      emissiveIntensity: config.emissiveIntensity !== undefined ? config.emissiveIntensity : 1.0
    });

    if (config.map) material.map = config.map;
    if (config.normalMap) material.normalMap = config.normalMap;
    if (config.roughnessMap) material.roughnessMap = config.roughnessMap;
    if (config.metalnessMap) material.metalnessMap = config.metalnessMap;
    if (config.aoMap) material.aoMap = config.aoMap;
    if (config.emissiveMap) material.emissiveMap = config.emissiveMap;

    material.needsUpdate = true;
    this.materials.set(id, material);
    return material;
  }

  public getMaterial(id: string): THREE.Material | undefined {
    return this.materials.get(id);
  }

  public updateMaterial(id: string, updates: Partial<PBRMaterialConfig>) {
    const material = this.materials.get(id);
    if (!material || !(material instanceof THREE.MeshPhysicalMaterial)) return;

    if (updates.color !== undefined) material.color.set(updates.color);
    if (updates.roughness !== undefined) material.roughness = updates.roughness;
    if (updates.metalness !== undefined) material.metalness = updates.metalness;
    if (updates.emissive !== undefined) material.emissive.set(updates.emissive);
    if (updates.emissiveIntensity !== undefined) material.emissiveIntensity = updates.emissiveIntensity;
    
    // Process map updates here mapping etc...
    material.needsUpdate = true;
  }

  public hotReloadShader(id: string, vertexShader?: string, fragmentShader?: string) {
    const material = this.materials.get(id);
    if (material && material instanceof THREE.ShaderMaterial) {
      if (vertexShader) material.vertexShader = vertexShader;
      if (fragmentShader) material.fragmentShader = fragmentShader;
      material.needsUpdate = true;
    }
  }
}
