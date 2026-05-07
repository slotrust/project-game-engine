import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

export interface RenderPassConfig {
  name: string;
  enabled: boolean;
  execute: (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) => void;
}

export class RenderGraph {
  private passes: Map<string, RenderPassConfig> = new Map();
  private executionOrder: string[] = [];

  public addPass(name: string, config: RenderPassConfig, dependsOn?: string[]) {
    this.passes.set(name, config);
    // Topological sort simulation for dependency representation
    if (dependsOn) {
        // Enforce ordering based on dependencies
        const insertIdx = this.executionOrder.findIndex(p => dependsOn.includes(p));
        if (insertIdx !== -1) {
            this.executionOrder.splice(insertIdx + 1, 0, name);
        } else {
            this.executionOrder.push(name);
        }
    } else {
        this.executionOrder.push(name);
    }
  }

  public enablePass(name: string, enabled: boolean) {
      if (this.passes.has(name)) {
          this.passes.get(name)!.enabled = enabled;
      }
  }

  public execute(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
      // Execute the graph
      for (const passName of this.executionOrder) {
          const pass = this.passes.get(passName);
          if (pass && pass.enabled) {
              pass.execute(renderer, scene, camera);
          }
      }
  }
}
