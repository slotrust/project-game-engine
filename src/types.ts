export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type AnimStateId = string;

export interface AnimBlendNode {
  type: '1D' | '2D';
  parameterX: string;
  parameterY?: string;
  clips: { clipName: string; valueX: number; valueY?: number }[];
}

export interface AnimState {
  id: AnimStateId;
  name: string;
  type: 'clip' | 'blendTree';
  clipName?: string;
  blendNode?: AnimBlendNode;
  speed: number;
  loop: boolean;
  rootMotion: boolean;
  position?: { x: number; y: number }; // For graph editor visual position
}

export interface AnimTransition {
  id: string;
  fromStateId: AnimStateId;
  toStateId: AnimStateId;
  condition: string; // evaluated script expression e.g. "params.speed > 0.1"
  duration: number; 
}

export interface AnimGraph {
  states: AnimState[];
  transitions: AnimTransition[];
  initialStateId: AnimStateId;
  parameters: Record<string, number | boolean>; 
}

export interface IKTarget {
  boneName: string;
  targetId?: string; // The object id to target
  targetPosition?: Vector3; // World position if no object
  weight: number;
  iterations: number;
}

export interface AnimationProps {
  enabled: boolean;
  graph?: AnimGraph;
  ikTargets?: IKTarget[];
  defaultClip?: string; 
  playbackRate?: number;
}

export interface PhysicsProps {
  enabled: boolean;
  isStatic: boolean;
  isTrigger: boolean;
  collisionLayer: number;
  collisionMask: number;
  colliderType?: 'box' | 'sphere' | 'cylinder' | 'capsule' | 'mesh' | 'hull';
  restitution: number;
  friction: number;
  velocity: Vector3;
  mass: number;
  linearDamping?: number;
  angularDamping?: number;
}

export interface GameObject {
  id: string;
  name: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  geometry: 'box' | 'sphere' | 'plane' | 'model' | 'pointLight' | 'spotLight' | 'group' | 'particles';
  parentId?: string;
  
  // Animation Component
  animation?: AnimationProps;
  particles?: {
    enabled: boolean;
    color: string;
    count: number;
    size: number;
    speed: number;
    spread: number;
  };
  color: string;
  metalness?: number;
  roughness?: number;
  textureId?: string;
  lightProps?: {
    intensity: number;
    distance: number;
    angle?: number;
    penumbra?: number;
  };
  spriteId?: string;
  modelId?: string;
  lods?: { distance: number; modelId: string }[];
  
  // Script Component
  scriptType?: 'javascript' | 'lua';
  script: string;
  
  // Physics Component
  physics: PhysicsProps;
  
  // Camera Component
  isCamera?: boolean;
  cameraProps?: {
    fov: number;
    near: number;
    far: number;
  };
  
  // Audio Component
  audioProps?: {
    url?: string;
    loop?: boolean;
    volume?: number;
    distance?: number;
  };
}

export const DEFAULT_PHYSICS: PhysicsProps = {
  enabled: false,
  isStatic: false,
  isTrigger: false,
  collisionLayer: 1,
  collisionMask: 0xFFFFFFFF,
  restitution: 0.2,
  friction: 0.3,
  velocity: { x: 0, y: 0, z: 0 },
  mass: 1,
};

export const DEFAULT_SCRIPT = `function update(gameObject, input, deltaTime)
  -- Lua logic here
end
`;

export type EngineMode = 'edit' | 'play' | 'pause';

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
  inputMappings?: Record<string, string[]>;
  showPhysicsColliders?: boolean;
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
  type: 'image' | 'sound' | 'model' | 'hdr' | 'prefab';
  url?: string;
  data?: any; // For storing the raw JSON data of a prefab
}


