import { EventDispatcher } from './EventDispatcher';
import { Logger } from './Logger';
import { Time } from './Time';
import { Registry } from './ECS';

export interface ApplicationOptions {
  name: string;
  width?: number;
  height?: number;
}

export class Application {
  private static _instance: Application;
  
  private _isRunning: boolean = false;
  private _eventDispatcher: EventDispatcher;
  private _registry: Registry;
  private _animationFrameId: number = 0;

  constructor(options: ApplicationOptions) {
    if (Application._instance) {
      Logger.Error('Application already exists!');
      return;
    }
    Application._instance = this;
    
    Logger.Info(`Engine Initializing: ${options.name}`);
    
    this._eventDispatcher = new EventDispatcher();
    this._registry = new Registry();
  }

  public static get(): Application {
    return this._instance;
  }

  public get eventDispatcher(): EventDispatcher {
    return this._eventDispatcher;
  }

  public get registry(): Registry {
    return this._registry;
  }

  public start() {
    this._isRunning = true;
    Time.init();
    Logger.Info('Application started executing.');
    this.run();
  }

  public stop() {
    this._isRunning = false;
    cancelAnimationFrame(this._animationFrameId);
    Logger.Info('Application stopped.');
  }

  private run = () => {
    if (!this._isRunning) return;

    Time.tick();
    
    // Engine pre-update, update, post-update phases would go here
    this._registry.updateSystems(Time.deltaTime);

    this._animationFrameId = requestAnimationFrame(this.run);
  }
}
