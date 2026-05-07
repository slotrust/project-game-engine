import { System, Registry } from './ECS';
import { TransformComponent, PhysicsComponent, MeshComponent } from './Components';

export class TransformSystem extends System {
  constructor(private registry: Registry) {
    super();
  }

  update(deltaTime: number): void {
    for (const entity of this.entities) {
      const transform = this.registry.getComponent(entity, TransformComponent);
      if (transform && transform.needsUpdate) {
        transform.matrix.compose(
          transform.position,
          new (require('three').Quaternion)().setFromEuler(transform.rotation),
          transform.scale
        );
        transform.needsUpdate = false;
      }
    }
  }
}

export class PhysicsSystem extends System {
  private gravity = -9.81;

  constructor(private registry: Registry) {
    super();
  }

  update(deltaTime: number): void {
    for (const entity of this.entities) {
      const transform = this.registry.getComponent(entity, TransformComponent);
      const physics = this.registry.getComponent(entity, PhysicsComponent);
      
      if (transform && physics && !physics.isStatic) {
        // Simple Euler integration for demo (before CANNON/Rapier integration)
        physics.velocity.y += this.gravity * deltaTime;
        
        transform.position.x += physics.velocity.x * deltaTime;
        transform.position.y += physics.velocity.y * deltaTime;
        transform.position.z += physics.velocity.z * deltaTime;
        
        // Fake floor bounce
        if (transform.position.y < 0.5) {
          transform.position.y = 0.5;
          physics.velocity.y *= -physics.bounciness;
        }
        
        transform.needsUpdate = true;
      }
    }
  }
}

export class RenderSyncSystem extends System {
  constructor(private registry: Registry) {
    super();
  }

  update(deltaTime: number): void {
    for (const entity of this.entities) {
      const transform = this.registry.getComponent(entity, TransformComponent);
      const meshComp = this.registry.getComponent(entity, MeshComponent);
      
      if (transform && meshComp) {
        meshComp.mesh.position.copy(transform.position);
        meshComp.mesh.rotation.copy(transform.rotation);
        meshComp.mesh.scale.copy(transform.scale);
      }
    }
  }
}
