import * as THREE from 'three';
import { GameObject, AnimGraph, AnimState, AnimTransition } from '../types';

interface RunningState {
  state: AnimState;
  action: THREE.AnimationAction | null;
  weight: number;
}

export class AnimationSystem {
  mixers: Map<string, THREE.AnimationMixer> = new Map();
  graphs: Map<string, AnimGraph> = new Map();
  // id -> current running states info
  runningStates: Map<string, RunningState[]> = new Map();
  params: Map<string, Record<string, number | boolean>> = new Map();
  
  cachedAnimations: Map<string, THREE.AnimationClip[]> = new Map();
  
  constructor() {}
  
  registerObject(id: string, model: THREE.Object3D, animations: THREE.AnimationClip[], graph?: AnimGraph, defaultClip?: string) {
    if (!model || animations.length === 0) return;
    
    // Create mixer
    const mixer = new THREE.AnimationMixer(model);
    this.mixers.set(id, mixer);
    
    // Store animations in a map for easy lookup
    this.cachedAnimations.set(id, animations);
    
    if (graph && graph.states.length > 0) {
      this.graphs.set(id, graph);
      const initialState = graph.states.find(s => s.id === graph.initialStateId) || graph.states[0];
      this.transitToState(id, initialState, 0); // instant
    } else if (defaultClip) {
      // Setup simple default clip playback
      const clip = animations.find(a => a.name === defaultClip) || animations[0];
      if (clip) {
        const action = mixer.clipAction(clip);
        action.play();
      }
    } else {
      // Just play the first one by default
      const action = mixer.clipAction(animations[0]);
      action.play();
    }
  }
  
  unregisterObject(id: string) {
    this.mixers.delete(id);
    this.graphs.delete(id);
    this.runningStates.delete(id);
    this.params.delete(id);
    this.cachedAnimations.delete(id);
  }

  setParam(id: string, name: string, value: number | boolean) {
    if (!this.params.has(id)) {
      this.params.set(id, {});
    }
    this.params.get(id)![name] = value;
  }
  
  getParam(id: string, name: string) {
    return this.params.get(id)?.[name];
  }
  
  transitToState(objId: string, targetState: AnimState, duration: number) {
    const mixer = this.mixers.get(objId);
    const animations = this.cachedAnimations.get(objId);
    if (!mixer || !animations) return;
    
    // Find clip
    let action: THREE.AnimationAction | null = null;
    if (targetState.type === 'clip' && targetState.clipName) {
      const clip = animations.find(a => a.name === targetState.clipName);
      if (clip) {
        action = mixer.clipAction(clip);
        action.reset();
        action.setEffectiveTimeScale(targetState.speed);
        if (!targetState.loop) {
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
        } else {
          action.setLoop(THREE.LoopRepeat, Infinity);
        }
        action.play();
      }
    } else if (targetState.type === 'blendTree') {
      // Implement blend tree
      // For now, no-op or partial implement
    }
    
    const currentRunners = this.runningStates.get(objId) || [];
    
    // Fade out everyone else
    const newRunners: RunningState[] = [];
    currentRunners.forEach(runner => {
      if (runner.action && duration > 0) {
         runner.action.fadeOut(duration);
      } else if (runner.action) {
         runner.action.stop();
      }
    });
    
    if (action && duration > 0) {
      action.fadeIn(duration);
    }
    
    newRunners.push({ state: targetState, action, weight: 1.0 });
    this.runningStates.set(objId, newRunners);
  }
  
  evaluateTransitions(objId: string, params: Record<string, number | boolean>) {
    const graph = this.graphs.get(objId);
    const runners = this.runningStates.get(objId);
    if (!graph || !runners || runners.length === 0) return;
    
    // Find primary runner (highest weight)
    const primaryRunner = runners[runners.length - 1]; // Assume last pushed is the active target state
    if (!primaryRunner) return;
    
    const possibleTransitions = graph.transitions.filter(t => t.fromStateId === primaryRunner.state.id);
    
    for (const transition of possibleTransitions) {
       // Evaluate condition safely
       try {
         // evaluate "params.speed > 5" style string using a function
         const func = new Function('params', 'return (' + transition.condition + ');');
         const result = func(params);
         if (result) {
            const targetState = graph.states.find(s => s.id === transition.toStateId);
            if (targetState) {
               this.transitToState(objId, targetState, transition.duration);
               break; // only take one transition per frame for now
            }
         }
       } catch(e) {
         console.warn("AnimGraph condition evaluation failed: ", transition.condition);
       }
    }
  }

  update(dt: number) {
    // 0. evaluate transitions
    for (const id of this.graphs.keys()) {
      const p = this.params.get(id) || {};
      this.evaluateTransitions(id, p);
    }
    
    // 1. Update mixers
    for (const [id, mixer] of this.mixers.entries()) {
      mixer.update(dt);
    }
    
    // 2. Evaluate BlendTrees
    // TODO: if current state is blend tree, recalculate weights based on parameters
    
    // 3. Apply IK (To be implemented post-mixer update)
  }
}
