import * as THREE from 'three';

export interface LightConfig {
  color: THREE.ColorRepresentation;
  intensity: number;
  castShadow: boolean;
}

export class LightSystem {
  private lights: Map<string, THREE.Light> = new Map();
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public createDirectionalLight(id: string, config: LightConfig, direction: THREE.Vector3): THREE.DirectionalLight {
    const light = new THREE.DirectionalLight(config.color, config.intensity);
    light.position.copy(direction).multiplyScalar(-10); // Position it opposite to direction
    light.target.position.set(0, 0, 0);
    
    if (config.castShadow) {
      light.castShadow = true;
      // Configure cascaded-style high-res shadow map
      light.shadow.mapSize.width = 4096;
      light.shadow.mapSize.height = 4096;
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = 1500;
      const d = 50;
      light.shadow.camera.left = -d;
      light.shadow.camera.right = d;
      light.shadow.camera.top = d;
      light.shadow.camera.bottom = -d;
      light.shadow.bias = -0.0005;
    }

    this.scene.add(light);
    this.scene.add(light.target);
    this.lights.set(id, light);
    return light;
  }

  public createPointLight(id: string, config: LightConfig, position: THREE.Vector3, distance: number = 0, decay: number = 2): THREE.PointLight {
    const light = new THREE.PointLight(config.color, config.intensity, distance, decay);
    light.position.copy(position);
    
    if (config.castShadow) {
      light.castShadow = true;
      light.shadow.mapSize.width = 2048;
      light.shadow.mapSize.height = 2048;
      light.shadow.bias = -0.001;
    }

    this.scene.add(light);
    this.lights.set(id, light);
    return light;
  }

  public createSpotLight(id: string, config: LightConfig, position: THREE.Vector3, targetPos: THREE.Vector3, angle: number, penumbra: number): THREE.SpotLight {
    const light = new THREE.SpotLight(config.color, config.intensity, 0, angle, penumbra);
    light.position.copy(position);
    light.target.position.copy(targetPos);
    
    if (config.castShadow) {
      light.castShadow = true;
      light.shadow.mapSize.width = 2048;
      light.shadow.mapSize.height = 2048;
      light.shadow.bias = -0.0005;
    }

    this.scene.add(light);
    this.scene.add(light.target);
    this.lights.set(id, light);
    return light;
  }

  public createEnvironment(hdrTexture: THREE.Texture) {
    hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
    this.scene.environment = hdrTexture;
    this.scene.background = hdrTexture;
  }

  public removeLight(id: string) {
    const light = this.lights.get(id);
    if (light) {
      this.scene.remove(light);
      if (light instanceof THREE.SpotLight || light instanceof THREE.DirectionalLight) {
        this.scene.remove(light.target);
      }
      this.lights.delete(id);
    }
  }

  public getLight(id: string): THREE.Light | undefined {
    return this.lights.get(id);
  }
}
