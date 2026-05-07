/**
 * Simple ECS (Entity Component System) implementation in TypeScript
 */

export type Entity = number;

export abstract class Component {
  // Base class for all components
}

export abstract class System {
  protected entities: Set<Entity> = new Set();

  public addEntity(entity: Entity) {
    this.entities.add(entity);
  }

  public removeEntity(entity: Entity) {
    this.entities.delete(entity);
  }

  abstract update(deltaTime: number): void;
}

export class Registry {
  private nextEntityId: Entity = 0;
  private entities: Set<Entity> = new Set();
  private components: Map<string, Map<Entity, Component>> = new Map();
  private systems: System[] = [];

  public createEntity(): Entity {
    const entity = this.nextEntityId++;
    this.entities.add(entity);
    return entity;
  }

  public destroyEntity(entity: Entity) {
    this.entities.delete(entity);
    
    // Remove all components for this entity
    for (const [componentName, componentMap] of this.components.entries()) {
      componentMap.delete(entity);
    }
    
    // Remove entity from all systems
    for (const system of this.systems) {
      system.removeEntity(entity);
    }
  }

  public addComponent<T extends Component>(entity: Entity, component: T): void {
    const componentName = component.constructor.name;
    if (!this.components.has(componentName)) {
      this.components.set(componentName, new Map());
    }
    this.components.get(componentName)!.set(entity, component);
    
    // In a full ECS, we would check system signatures here and add entity to relevant systems
  }

  public getComponent<T extends Component>(entity: Entity, componentClass: new (...args: any[]) => T): T | undefined {
    const componentName = componentClass.name;
    if (this.components.has(componentName)) {
      return this.components.get(componentName)!.get(entity) as T;
    }
    return undefined;
  }

  public removeComponent<T extends Component>(entity: Entity, componentClass: new (...args: any[]) => T): void {
    const componentName = componentClass.name;
    if (this.components.has(componentName)) {
      this.components.get(componentName)!.delete(entity);
    }
  }

  public hasComponent<T extends Component>(entity: Entity, componentClass: new (...args: any[]) => T): boolean {
    const componentName = componentClass.name;
    return this.components.has(componentName) ? this.components.get(componentName)!.has(entity) : false;
  }

  public registerSystem(system: System) {
    this.systems.push(system);
  }

  public updateSystems(deltaTime: number) {
    for (const system of this.systems) {
      system.update(deltaTime);
    }
  }
}
