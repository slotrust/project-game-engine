import { PhysicsSystem } from './PhysicsSystem';
import { ScriptSystem } from './ScriptSystem';
import { InputSystem } from './InputSystem';
import { AnimationSystem } from './AnimationSystem';
import { GameObject } from '../types';
import * as THREE from 'three';

export class GameEngine {
  public physics = new PhysicsSystem();
  public scripts = new ScriptSystem();
  public animation = new AnimationSystem();
  public input: InputSystem | null = null;
  private objects: Map<string, GameObject> = new Map();
  private lastTime = 0;
  private running = false;
  private rafId = 0;

  async init(domElement: HTMLElement) {
    await this.physics.init();
    
    // Create an API to expose to scripts
    const engineAPI = {
      applyForce: (id: string, x: number, y: number, z: number) => {
        this.physics.applyForce(id, {x, y, z});
      },
      setLinearVelocity: (id: string, x: number, y: number, z: number) => {
        this.physics.setLinearVelocity(id, {x, y, z});
      },
      getLinearVelocity: (id: string) => {
        return this.physics.getLinearVelocity(id) || {x: 0, y: 0, z: 0};
      },
      setPosition: (id: string, x: number, y: number, z: number) => {
        const obj = this.objects.get(id);
        if (obj) {
          obj.position = { x, y, z };
          this.physics.setPosition(id, { x, y, z }); // Sync to physics if it has physics
        }
      },
      setRotation: (id: string, x: number, y: number, z: number) => {
        const obj = this.objects.get(id);
        if (obj) {
           obj.rotation = { x, y, z }; // Euler
        }
      },
      setAnimParam: (id: string, paramName: string, value: number | boolean) => {
        this.animation.setParam(id, paramName, value);
      },
      isActionPressed: (action: string) => this.input?.isActionPressed(action),
      isKeyPressed: (key: string) => this.input?.isKeyPressed(key),
    };

    await this.scripts.init(engineAPI);
    this.input = new InputSystem(domElement);
    
    // Bind default actions
    this.input.bindAction('Move Right', ['ArrowRight', 'KeyD']);
    this.input.bindAction('Move Left', ['ArrowLeft', 'KeyA']);
    this.input.bindAction('Move Forward', ['ArrowUp', 'KeyW']);
    this.input.bindAction('Move Back', ['ArrowDown', 'KeyS']);
    this.input.bindAction('Jump', ['Space']);
  }

  loadScene(objects: GameObject[]) {
    this.objects.clear();
    // Add physics bodies
    for (const obj of objects) {
      this.objects.set(obj.id, obj);
      if (obj.physics?.enabled) {
        this.physics.addBody(obj.id, obj.position, obj.scale, obj.physics);
      }
      
      // Load scripts
      if (obj.script) {
        const objAPI = {
          getId: () => obj.id,
          getPosition: () => {
             const transform = this.physics.getTransform(obj.id);
             return transform ? { ...transform.position } : { ...obj.position };
          }
        };
        this.scripts.loadScript(obj.id, obj.script, objAPI);
      }
    }
  }

  // Gets visual transform for rendering (called by React)
  getVisualTransforms() {
    const transforms: Record<string, { position: any, rotation: any }> = {};
    for (const [id, obj] of this.objects.entries()) {
      const transform = this.physics.getTransform(id);
      if (transform) {
        transforms[id] = transform;
      } else {
        transforms[id] = { position: obj.position, rotation: obj.rotation }; // fallback without physics
      }
    }
    return transforms;
  }

  getMainCameraTransform() {
    for (const [id, obj] of this.objects.entries()) {
      if (obj.isCamera) {
        return this.physics.getTransform(id) || { position: obj.position, rotation: obj.rotation };
      }
    }
    return null;
  }

  start() {
    if (this.running) return;
    this.running = true;
  }

  stop() {
    this.running = false;
  }

  update(dt: number) {
    if (!this.running) return;

    // Limit dt to avoid huge jumps
    const safeDt = Math.min(dt, 0.1);

    // Update Scripts
    this.scripts.update(safeDt);
    
    // Update Animation
    this.animation.update(safeDt);

    // Update Physics
    this.physics.update(safeDt);

    // Reset frame inputs (like mouse delta)
    this.input?.resetFrame();
  }

  dispose() {
    this.stop();
    this.physics.dispose();
    this.scripts.dispose();
    this.input?.dispose();
  }
}
