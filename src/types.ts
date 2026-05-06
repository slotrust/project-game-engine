export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface PhysicsProps {
  enabled: boolean;
  isStatic: boolean;
  velocity: Vector3;
  mass: number;
  bounciness: number;
}

export interface GameObject {
  id: string;
  name: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  geometry: 'box' | 'sphere' | 'plane' | 'model' | 'pointLight' | 'spotLight';
  color: string;
  metalness?: number;
  roughness?: number;
  lightProps?: {
    intensity: number;
    distance: number;
    angle?: number;
    penumbra?: number;
  };
  spriteId?: string;
  modelId?: string;
  script: string;
  physics: PhysicsProps;
}

export const DEFAULT_PHYSICS: PhysicsProps = {
  enabled: false,
  isStatic: false,
  velocity: { x: 0, y: 0, z: 0 },
  mass: 1,
  bounciness: 0.2,
};

export const DEFAULT_SCRIPT = `function update(gameObject, input, window, deltaTime) {
  // AI-generated or custom logic here
  
}
`;

export type EngineMode = 'edit' | 'play';

export interface SceneConfig {
  ambientLightColor: string;
  ambientLightIntensity: number;
  directionalLightColor: string;
  directionalLightIntensity: number;
  directionalLightPosition: Vector3;
  skyboxUrl?: string; // URL for skybox image/hdr
  bloomEnabled?: boolean;
  bloomIntensity?: number;
  bloomThreshold?: number;
  bloomRadius?: number;
}

export interface Scene {
  id: string;
  name: string;
  objects: GameObject[];
  config: SceneConfig;
}

export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'sound' | 'model' | 'hdr';
  url: string;
}


