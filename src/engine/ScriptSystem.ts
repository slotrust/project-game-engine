import { LuaFactory } from 'wasmoon';
import { GameObject } from '../types';
import { InputSystem } from './InputSystem';

interface ScriptInstance {
  update: (dt: number) => void;
  start: () => void;
  dispose: () => void;
}

export class ScriptSystem {
  private factory: any = null;
  private lua: any = null;
  public globalAPI: any = {};
  private activeScripts: Map<string, ScriptInstance> = new Map();

  async init(engineAPI: any) {
    this.factory = new LuaFactory();
    this.lua = await this.factory.createEngine();
    
    // Mount engine API to Lua global
    this.lua.global.set('Engine', engineAPI);
  }

  mountObjectAPI(objId: string, api: any) {
    // If we want per-object tables, we could do it here
    this.lua.global.set('Obj_' + objId, api);
  }

  loadScript(objId: string, code: string, api: any) {
    if (!this.lua) return;
    try {
      // Create an environment for this script
      const scriptEnv = `
        local Engine = Engine
        local self = Obj_${objId}
        ${code}
        return {
          start = type(start) == "function" and start or function() end,
          update = type(update) == "function" and update or function(dt) end
        }
      `;
      this.mountObjectAPI(objId, api);
      const res = this.lua.doStringSync(scriptEnv);
      
      this.activeScripts.set(objId, {
        start: () => res.start(),
        update: (dt: number) => res.update(dt),
        dispose: () => {
          this.lua.global.set('Obj_' + objId, null);
        }
      });
      
      // Call start immediately upon loading
      this.activeScripts.get(objId)?.start();
    } catch (e) {
      console.error(`Lua Error in object ${objId}:`, e);
    }
  }

  update(dt: number) {
    for (const [id, script] of this.activeScripts.entries()) {
      try {
        script.update(dt);
      } catch (e) {
        console.error(`Lua update Error in object ${id}:`, e);
      }
    }
  }

  removeScript(objId: string) {
    const script = this.activeScripts.get(objId);
    if (script) {
      script.dispose();
      this.activeScripts.delete(objId);
    }
  }

  dispose() {
    this.activeScripts.clear();
    if (this.lua) {
      this.lua.global.close();
      this.lua = null;
    }
  }
}
