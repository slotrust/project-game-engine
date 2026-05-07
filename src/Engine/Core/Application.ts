import { EventDispatcher } from './EventDispatcher';
import { Logger } from './Logger';
import { Time } from './Time';
import { Registry } from './ECS';
import { Input } from './Input';
import { LayerStack } from './LayerStack';
import { Layer } from './Layer';
import { JobSystem } from './JobSystem';

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
  private _layerStack: LayerStack;
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
    this._layerStack = new LayerStack();
    
    Input.init();
    JobSystem.init();
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

  public pushLayer(layer: Layer) {
    this._layerStack.pushLayer(layer);
  }

  public pushOverlay(overlay: Layer) {
    this._layerStack.pushOverlay(overlay);
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
    
    for (const layer of this._layerStack.getLayers()) {
      layer.onUpdate(Time.deltaTime);
    }
    
    this._registry.updateSystems(Time.deltaTime);

    this._animationFrameId = requestAnimationFrame(this.run);
  }
}

