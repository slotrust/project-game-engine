import initJolt from 'jolt-physics';
import { Vector3, PhysicsProps } from '../types';

export class PhysicsSystem {
  public Jolt: any = null;
  public world: any = null;
  private joltInterface: any = null;
  private physicsSystem: any = null;
  private bodyInterface: any = null;
  private bodies: Map<string, any> = new Map();

  // Settings
  private layerStatic = 0;
  private layerMoving = 1;
  private bpLayerStatic = 0;
  private bpLayerMoving = 1;

  async init() {
    this.Jolt = await initJolt();
    
    // Setup boilerplate
    const settings = new this.Jolt.JoltSettings();
    
    // 1. BroadPhaseLayerInterface
    const bpInterface = new this.Jolt.BroadPhaseLayerInterfaceTable(2, 2);
    const bpStatic = new this.Jolt.BroadPhaseLayer(this.bpLayerStatic);
    const bpMoving = new this.Jolt.BroadPhaseLayer(this.bpLayerMoving);

    bpInterface.MapObjectToBroadPhaseLayer(this.layerStatic, bpStatic);
    bpInterface.MapObjectToBroadPhaseLayer(this.layerMoving, bpMoving);
    
    // 2. ObjectLayerPairFilter
    const objFilter = new this.Jolt.ObjectLayerPairFilterTable(2);
    objFilter.EnableCollision(this.layerStatic, this.layerMoving);
    objFilter.EnableCollision(this.layerMoving, this.layerMoving);

    // 3. ObjectVsBroadPhaseLayerFilter
    const objBpFilter = new this.Jolt.ObjectVsBroadPhaseLayerFilterTable(bpInterface, 2, objFilter, 2);

    settings.mBroadPhaseLayerInterface = bpInterface;
    settings.mObjectLayerPairFilter = objFilter;
    settings.mObjectVsBroadPhaseLayerFilter = objBpFilter;

    this.joltInterface = new this.Jolt.JoltInterface(settings);

    this.physicsSystem = this.joltInterface.GetPhysicsSystem();
    this.bodyInterface = this.physicsSystem.GetBodyInterface();

    this.physicsSystem.SetGravity(new this.Jolt.Vec3(0, -9.81, 0));
  }

  addBody(id: string, position: Vector3, scale: Vector3, physics: PhysicsProps) {
    if (!this.Jolt || !this.bodyInterface) return;

    const jPos = new this.Jolt.Vec3(position.x, position.y, position.z);
    // Temporary identity rotation
    const jRot = new this.Jolt.Quat(0, 0, 0, 1);

    let shape;
    const type = physics.colliderType || 'box';
    if (type === 'sphere') {
      shape = new this.Jolt.SphereShape(scale.x / 2);
    } else {
      shape = new this.Jolt.BoxShape(new this.Jolt.Vec3(scale.x / 2, scale.y / 2, scale.z / 2), 0.05);
    }
    
    const layer = physics.isStatic ? this.layerStatic : this.layerMoving;
    const motionType = physics.isStatic ? this.Jolt.EMotionType_Static : this.Jolt.EMotionType_Dynamic;
    const objectLayer = physics.isStatic ? this.layerStatic : this.layerMoving;

    const creationSettings = new this.Jolt.BodyCreationSettings(shape, jPos, jRot, motionType, objectLayer);
    
    if (physics.isTrigger) {
      creationSettings.mIsSensor = true;
    }
    
    // Set material props if needed
    creationSettings.mRestitution = physics.restitution || 0.2;
    creationSettings.mFriction = physics.friction || 0.3;
    if (!physics.isStatic) {
      creationSettings.mLinearVelocity = new this.Jolt.Vec3(physics.velocity.x, physics.velocity.y, physics.velocity.z);
    }
    
    const body = this.bodyInterface.CreateBody(creationSettings);
    this.Jolt.destroy(creationSettings);

    const bodyId = body.GetID();
    this.bodyInterface.AddBody(body.GetID(), this.Jolt.EActivation_Activate);
    this.bodies.set(id, bodyId);
    return bodyId;
  }

  update(dt: number) {
    if (!this.joltInterface) return;
    // Step the physics world
    // dt, collision steps
    this.joltInterface.Step(Math.min(dt, 1/30), 1);
  }

  getTransform(id: string) {
    if (!this.bodyInterface) return null;
    const bodyId = this.bodies.get(id);
    if (!bodyId) return null;

    const p = this.bodyInterface.GetPosition(bodyId);
    const r = this.bodyInterface.GetRotation(bodyId);

    return {
      position: { x: p.GetX(), y: p.GetY(), z: p.GetZ() },
      rotation: { x: r.GetX(), y: r.GetY(), z: r.GetZ(), w: r.GetW() }
    };
  }

  applyForce(id: string, force: Vector3) {
    if (!this.bodyInterface) return;
    const bodyId = this.bodies.get(id);
    if (!bodyId) return;
    const v = new this.Jolt.Vec3(force.x, force.y, force.z);
    this.bodyInterface.AddForce(bodyId, v);
    this.Jolt.destroy(v);
  }
  
  setLinearVelocity(id: string, vel: Vector3) {
    if (!this.bodyInterface) return;
    const bodyId = this.bodies.get(id);
    if (!bodyId) return;
    const v = new this.Jolt.Vec3(vel.x, vel.y, vel.z);
    this.bodyInterface.SetLinearVelocity(bodyId, v);
    this.Jolt.destroy(v);
  }

  setPosition(id: string, pos: Vector3) {
    if (!this.bodyInterface) return;
    const bodyId = this.bodies.get(id);
    if (!bodyId) return;
    const v = new this.Jolt.Vec3(pos.x, pos.y, pos.z);
    this.bodyInterface.SetPosition(bodyId, v, this.Jolt.EActivation_Activate);
    this.Jolt.destroy(v);
  }

  getLinearVelocity(id: string) {
    if (!this.bodyInterface) return null;
    const bodyId = this.bodies.get(id);
    if (!bodyId) return null;
    const v = this.bodyInterface.GetLinearVelocity(bodyId);
    return { x: v.GetX(), y: v.GetY(), z: v.GetZ() };
  }

  removeBody(id: string) {
    if (!this.bodyInterface) return;
    const bodyId = this.bodies.get(id);
    if (bodyId) {
      this.bodyInterface.RemoveBody(bodyId);
      this.bodyInterface.DestroyBody(bodyId);
      this.bodies.delete(id);
    }
  }

  dispose() {
    if (this.Jolt) {
      for (const [id, bodyId] of this.bodies.entries()) {
         if(this.bodyInterface) {
           this.bodyInterface.RemoveBody(bodyId);
           this.bodyInterface.DestroyBody(bodyId);
         }
      }
      this.bodies.clear();

      if(this.physicsSystem) {
        // Cleanup jolt specifics if needed
      }

      this.joltInterface = null;
      this.Jolt = null;
    }
  }
}

