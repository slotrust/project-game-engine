import * as CANNON from 'cannon-es';

export class PhysicsEngine {
  private world: CANNON.World;

  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.81, 0),
    });
  }

  public step(deltaTime: number) {
    this.world.step(1/60, deltaTime, 3);
  }

  public getWorld() {
    return this.world;
  }
}
