import { Component } from './ECS';
import * as THREE from 'three';

export class TransformComponent extends Component {
  public position: THREE.Vector3 = new THREE.Vector3();
  public rotation: THREE.Euler = new THREE.Euler();
  public scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);
  
  // Matrix cache for rendering
  public matrix: THREE.Matrix4 = new THREE.Matrix4();
  public needsUpdate: boolean = true;
}

export class MeshComponent extends Component {
  constructor(public mesh: THREE.Mesh) {
    super();
  }
}

export class PhysicsComponent extends Component {
  public mass: number = 1;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public bounciness: number = 0.2;
  public isStatic: boolean = false;
  // CANNON.Body or Rapier reference would go here
}

export class ScriptComponent extends Component {
  public scriptName: string = '';
  public onUpdate?: (deltaTime: number) => void;
  public onStart?: () => void;
}
