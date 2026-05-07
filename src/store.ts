import { create } from 'zustand';
import { GameObject, EngineMode, DEFAULT_SCRIPT, Scene, Asset, DEFAULT_PHYSICS, SceneConfig } from './types';

export const generateId = () => Math.random().toString(36).substring(2, 9);

interface EngineState {
  mode: EngineMode;
  scenes: Scene[];
  activeSceneId: string;
  assets: Asset[];
  selectedId: string | null;
  selectedIds: string[];

  // History tracking (for the active scene's objects)
  past: GameObject[][];
  future: GameObject[][];

  // Actions
  setMode: (mode: EngineMode) => void;
  addScene: (name: string) => void;
  switchScene: (id: string) => void;
  addAsset: (asset: Omit<Asset, 'id'> & { id?: string }) => void;
  deleteAsset: (id: string) => void;
  
  addObject: (obj: Partial<GameObject>) => void;
  updateObject: (id: string, updates: Partial<GameObject>) => void;
  updateSceneConfig: (updates: Partial<SceneConfig>) => void;
  deleteObject: (id: string) => void;
  selectObject: (id: string | null, multi?: boolean) => void;
  groupSelected: () => void;

  // Undo / Redo
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;

  getObjects: () => GameObject[];

  snapEnabled: boolean;
  snapTranslation: number;
  snapRotation: number;
  snapScale: number;
  setSnapEnabled: (v: boolean) => void;
  setSnapTranslation: (v: number) => void;
  setSnapRotation: (v: number) => void;
  setSnapScale: (v: number) => void;
}

const initialSceneId = generateId();

const DEFAULT_SCENE_CONFIG = {
  ambientLightColor: '#ffffff',
  ambientLightIntensity: 0.6,
  directionalLightColor: '#ffffff',
  directionalLightIntensity: 0.8,
  directionalLightPosition: { x: 10, y: 20, z: 10 },
  inputMappings: {
    'Move Forward': ['KeyW', 'ArrowUp'],
    'Move Back': ['KeyS', 'ArrowDown'],
    'Move Left': ['KeyA', 'ArrowLeft'],
    'Move Right': ['KeyD', 'ArrowRight'],
    'Jump': ['Space'],
    'Action': ['Enter', 'KeyE']
  }
};

export const useStore = create<EngineState>((set, get) => ({
  mode: 'edit',
  scenes: [
    {
      id: initialSceneId,
      name: 'Main Scene',
      config: { ...DEFAULT_SCENE_CONFIG },
      objects: [
        {
          id: generateId(),
          name: 'Player',
          position: { x: 0, y: 1, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          geometry: 'box',
          color: '#34d399',
          physics: { ...DEFAULT_PHYSICS },
          script: `function update(gameObject, input, window, deltaTime) {
  const speed = 5;
  if (input.keys['ArrowRight'] || input.keys['KeyD']) gameObject.position.x += speed * deltaTime;
  if (input.keys['ArrowLeft'] || input.keys['KeyA']) gameObject.position.x -= speed * deltaTime;
  if (input.keys['ArrowUp'] || input.keys['KeyW']) gameObject.position.z -= speed * deltaTime;
  if (input.keys['ArrowDown'] || input.keys['KeyS']) gameObject.position.z += speed * deltaTime;
  if (input.keys['Space']) gameObject.position.y += speed * deltaTime;
}`
        },
        {
          id: generateId(),
          name: 'Ground',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: -Math.PI / 2, y: 0, z: 0 }, // Flat plane
          scale: { x: 10, y: 10, z: 1 },
          geometry: 'plane',
          color: '#3f3f46',
          physics: { ...DEFAULT_PHYSICS, isStatic: true },
          script: DEFAULT_SCRIPT
        }
      ]
    }
  ],
  activeSceneId: initialSceneId,
  assets: [{ id: generateId(), name: 'Coin', type: 'image', url: 'https://cdn.pixabay.com/photo/2013/07/12/15/36/coin-150143_960_720.png' }],
  selectedId: null,
  selectedIds: [],
  
  snapEnabled: false,
  snapTranslation: 1,
  snapRotation: Math.PI / 4,
  snapScale: 1,
  setSnapEnabled: (v) => set({ snapEnabled: v }),
  setSnapTranslation: (v) => set({ snapTranslation: v }),
  setSnapRotation: (v) => set({ snapRotation: v }),
  setSnapScale: (v) => set({ snapScale: v }),

  past: [],
  future: [],

  setMode: (mode) => set({ mode }),

  getObjects: () => {
    const s = get();
    return s.scenes.find(sc => sc.id === s.activeSceneId)?.objects || [];
  },

  saveHistory: () => set((state) => {
    if (state.mode === 'play') return state; // Don't save history during play
    const currentObjects = state.scenes.find(sc => sc.id === state.activeSceneId)?.objects || [];
    return {
      past: [...state.past, JSON.parse(JSON.stringify(currentObjects))],
      future: []
    };
  }),

  undo: () => set((state) => {
    if (state.mode === 'play' || state.past.length === 0) return state;
    const pastCopy = [...state.past];
    const previousObjects = pastCopy.pop()!;
    const currentObjects = state.scenes.find(sc => sc.id === state.activeSceneId)?.objects || [];
    
    return {
      past: pastCopy,
      future: [JSON.parse(JSON.stringify(currentObjects)), ...state.future],
      scenes: state.scenes.map(sc => 
        sc.id === state.activeSceneId ? { ...sc, objects: previousObjects } : sc
      ),
      selectedId: null,
      selectedIds: []
    };
  }),

  redo: () => set((state) => {
    if (state.mode === 'play' || state.future.length === 0) return state;
    const futureCopy = [...state.future];
    const nextObjects = futureCopy.shift()!;
    const currentObjects = state.scenes.find(sc => sc.id === state.activeSceneId)?.objects || [];
    
    return {
      past: [...state.past, JSON.parse(JSON.stringify(currentObjects))],
      future: futureCopy,
      scenes: state.scenes.map(sc => 
        sc.id === state.activeSceneId ? { ...sc, objects: nextObjects } : sc
      ),
      selectedId: null,
      selectedIds: []
    };
  }),

  addScene: (name) => set(state => {
    const newSceneId = generateId();
    return {
      scenes: [...state.scenes, { id: newSceneId, name, config: { ...DEFAULT_SCENE_CONFIG }, objects: [] }],
      activeSceneId: newSceneId,
      past: [],
      future: [],
      selectedId: null,
      selectedIds: []
    };
  }),

  switchScene: (id) => set(state => ({
    activeSceneId: id,
    selectedId: null,
    selectedIds: [],
    past: [],
    future: []
  })),

  addAsset: (asset) => set(state => ({
    assets: [...state.assets, { id: asset.id || generateId(), name: asset.name, type: asset.type, url: asset.url }]
  })),

  deleteAsset: (id) => set(state => ({
    assets: state.assets.filter(a => a.id !== id)
  })),

  addObject: (obj) => {
    get().saveHistory();
    set((state) => {
      const newObj: GameObject = {
        id: generateId(),
        name: obj.name || 'New Object',
        position: obj.position ?? { x: 0, y: 0, z: 0 },
        rotation: obj.rotation ?? { x: 0, y: 0, z: 0 },
        scale: obj.scale ?? { x: 1, y: 1, z: 1 },
        geometry: obj.geometry ?? 'box',
        color: obj.color ?? '#60a5fa',
        script: obj.script ?? DEFAULT_SCRIPT,
        physics: obj.physics ?? { ...DEFAULT_PHYSICS },
        spriteId: obj.spriteId
      };
      
      const updatedScenes = state.scenes.map(sc => 
        sc.id === state.activeSceneId ? { ...sc, objects: [...sc.objects, newObj] } : sc
      );
      
      return { 
        scenes: updatedScenes, 
        selectedId: newObj.id,
        selectedIds: [newObj.id]
      };
    });
  },

  updateObject: (id, updates) => set((state) => {
    const updatedScenes = state.scenes.map(sc => {
      if (sc.id !== state.activeSceneId) return sc;
      return {
        ...sc,
        objects: sc.objects.map(o => o.id === id ? { ...o, ...updates } : o)
      };
    });
    return { scenes: updatedScenes };
  }),

  updateSceneConfig: (updates) => set((state) => {
    const updatedScenes = state.scenes.map(sc => {
      if (sc.id !== state.activeSceneId) return sc;
      return {
        ...sc,
        config: { ...sc.config, ...updates }
      };
    });
    return { scenes: updatedScenes };
  }),

  deleteObject: (id) => {
    get().saveHistory();
    set((state) => {
      const updatedScenes = state.scenes.map(sc => {
        if (sc.id !== state.activeSceneId) return sc;
        return {
          ...sc,
          objects: sc.objects.filter(o => o.id !== id)
        };
      });
      return {
        scenes: updatedScenes,
        selectedId: state.selectedId === id ? null : state.selectedId,
        selectedIds: state.selectedIds.filter(selected => selected !== id)
      };
    });
  },

  selectObject: (id, multi = false) => set(state => {
    if (!id) return { selectedId: null, selectedIds: [] };
    if (multi) {
      const isSelected = state.selectedIds.includes(id);
      const newIds = isSelected ? state.selectedIds.filter(x => x !== id) : [...state.selectedIds, id];
      return {
        selectedIds: newIds,
        selectedId: newIds.length > 0 ? newIds[newIds.length - 1] : null
      };
    }
    return { selectedId: id, selectedIds: [id] };
  }),

  groupSelected: () => {
    get().saveHistory();
    set(state => {
      const { selectedIds, activeSceneId, scenes } = state;
      if (selectedIds.length < 2) return state; // Need at least 2 objects to group
      
      const scene = scenes.find(s => s.id === activeSceneId);
      if (!scene) return state;

      const groupObj: GameObject = {
        id: generateId(),
        name: 'Group',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        geometry: 'group',
        color: '#ffffff',
        script: DEFAULT_SCRIPT,
        physics: { ...DEFAULT_PHYSICS }
      };

      const updatedObjects = scene.objects.map(o => {
        if (selectedIds.includes(o.id)) {
          return { ...o, parentId: groupObj.id };
        }
        return o;
      });

      const updatedScenes = scenes.map(s => 
        s.id === activeSceneId 
          ? { ...s, objects: [...updatedObjects, groupObj] } 
          : s
      );

      return {
        scenes: updatedScenes,
        selectedId: groupObj.id,
        selectedIds: [groupObj.id]
      };
    });
  }
}));
