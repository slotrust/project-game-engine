import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { GameObject } from '../types';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Move, RotateCw, Scaling } from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';

// Track input state globally
const inputState = { keys: {} as Record<string, boolean> };


window.addEventListener('keydown', e => { inputState.keys[e.code] = true; });
window.addEventListener('keyup', e => { inputState.keys[e.code] = false; });

export function Viewport() {
  const { mode, selectedId, selectedIds, groupSelected, selectObject, updateObject, deleteObject, assets, saveHistory, snapEnabled, setSnapEnabled, snapTranslation, snapRotation, snapScale } = useStore();
  const sceneConfig = useStore(s => s.scenes.find(sc => sc.id === s.activeSceneId)?.config);
  const objects = useStore(s => s.scenes.find(sc => sc.id === s.activeSceneId)?.objects || []);
  
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');

  const containerRef = useRef<HTMLDivElement>(null);
  
  // Three.js refs
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const renderPassRef = useRef<RenderPass | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);
  const mixersRef = useRef<{ [id: string]: THREE.AnimationMixer }>({});
  const animationActionsRef = useRef<{ [id: string]: { [name: string]: THREE.AnimationAction } }>({});
  const physicsHelpersRef = useRef<{ [id: string]: THREE.BoxHelper }>({});
  const isDraggingGizmo = useRef(false);
  
  const objectMeshesRef = useRef<Record<string, THREE.Object3D>>({});

  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const shouldStepRef = useRef<boolean>(false);
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  // Play Mode Overlay Stats
  const [fps, setFps] = useState(0);
  const fpsAcc = useRef({ frames: 0, lastTime: 0 });
  const [gameTime, setGameTime] = useState(0);
  const gameTimeRef = useRef(0);
  
  // Texture/Model caching
  const textureCache = useRef<Record<string, THREE.Texture>>({});
  const modelCache = useRef<Record<string, THREE.Object3D>>({});
  const [loadingAssets, setLoadingAssets] = useState<Record<string, { loaded: number, total: number }>>({});
  const [isAnyLoading, setIsAnyLoading] = useState(false);

  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // Init Three.js
  useEffect(() => {
    if (!containerRef.current) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#18181b');
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.set(0, 5, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Blender mappings: MMB=Orbit, Right(or Shift+MMB)=Pan, Scroll=Zoom
    controls.mouseButtons = {
      LEFT: null as any, // Left click is select
      MIDDLE: THREE.MOUSE.ROTATE,
      RIGHT: THREE.MOUSE.PAN
    };
    controlsRef.current = controls;

    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.setSize(1.2);
    transformControls.setSpace('local');
    transformControls.addEventListener('dragging-changed', function (event: any) {
      controls.enabled = !event.value;
      isDraggingGizmo.current = event.value;
      if (!event.value) { // finished dragging
        const obj = transformControls.object;
        if (obj && obj.userData.id) {
           useStore.getState().updateObject(obj.userData.id, {
             position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
             rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
             scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z }
           });
           useStore.getState().saveHistory();
        }
      }
    });
    scene.add(transformControls.getHelper());
    transformControlsRef.current = transformControls;
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(grid);

    // Post processing
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    composerRef.current = composer;
    renderPassRef.current = renderScene;
    bloomPassRef.current = bloomPass;
    
    return () => {
      if(controlsRef.current) controlsRef.current.dispose();
      if(transformControlsRef.current) transformControlsRef.current.dispose();
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // Update Scene Config (Lighting & Env)
  useEffect(() => {
    if (!sceneRef.current || !sceneConfig) return;
    
    if (ambientLightRef.current) {
      ambientLightRef.current.color.set(sceneConfig.ambientLightColor);
      ambientLightRef.current.intensity = sceneConfig.ambientLightIntensity;
    }
    
    if (dirLightRef.current) {
      dirLightRef.current.color.set(sceneConfig.directionalLightColor);
      dirLightRef.current.intensity = sceneConfig.directionalLightIntensity;
      if (sceneConfig.directionalLightPosition) {
         dirLightRef.current.position.set(
            sceneConfig.directionalLightPosition.x ?? 10,
            sceneConfig.directionalLightPosition.y ?? 20,
            sceneConfig.directionalLightPosition.z ?? 10
         );
      }
    }
    
    if (sceneConfig.skyboxUrl) {
      if (sceneConfig.skyboxUrl.endsWith('.hdr')) {
        new RGBELoader().load(sceneConfig.skyboxUrl, (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          sceneRef.current!.background = texture;
          sceneRef.current!.environment = texture;
        });
      } else {
        new THREE.TextureLoader().load(sceneConfig.skyboxUrl, (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          texture.colorSpace = THREE.SRGBColorSpace;
          sceneRef.current!.background = texture;
          sceneRef.current!.environment = texture;
        });
      }
    } else {
      sceneRef.current.background = new THREE.Color('#18181b');
      sceneRef.current.environment = null;
    }

    if (bloomPassRef.current) {
      bloomPassRef.current.enabled = sceneConfig.bloomEnabled ?? true;
      bloomPassRef.current.strength = sceneConfig.bloomIntensity ?? 0.5;
      bloomPassRef.current.threshold = sceneConfig.bloomThreshold ?? 0.8;
      bloomPassRef.current.radius = sceneConfig.bloomRadius ?? 0.2;
    }
  }, [sceneConfig]);

  // Keyboard controls for Blender mappings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow shift+MMB panning logic
      if (e.key === 'Shift' && controlsRef.current) {
         controlsRef.current.mouseButtons.MIDDLE = THREE.MOUSE.PAN;
      }
      
      if (mode !== 'edit' || !transformControlsRef.current) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'g': 
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            groupSelected();
          } else {
            setTransformMode('translate'); 
          }
          break;
        case 'r': 
          setTransformMode('rotate'); 
          break;
        case 's': 
          setTransformMode('scale'); 
          break;
        case 'delete':
        case 'backspace':
        case 'x':
           if (selectedId) deleteObject(selectedId);
           break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
       if (e.key === 'Shift' && controlsRef.current) {
          controlsRef.current.mouseButtons.MIDDLE = THREE.MOUSE.ROTATE;
       }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
       window.removeEventListener('keydown', handleKeyDown);
       window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mode, selectedId, selectedIds, deleteObject, groupSelected]);

  useEffect(() => {
    if (transformControlsRef.current) {
      transformControlsRef.current.setMode(transformMode);
      if (snapEnabled) {
         transformControlsRef.current.setTranslationSnap(snapTranslation);
         transformControlsRef.current.setRotationSnap(snapRotation);
         transformControlsRef.current.setScaleSnap(snapScale);
      } else {
         transformControlsRef.current.setTranslationSnap(null);
         transformControlsRef.current.setRotationSnap(null);
         transformControlsRef.current.setScaleSnap(null);
      }
    }
  }, [transformMode, snapEnabled, snapTranslation, snapRotation, snapScale]);

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        setDimensions({ width, height });
        rendererRef.current?.setSize(width, height);
        composerRef.current?.setSize(width, height);
        if (cameraRef.current) {
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const engineRef = useRef<GameEngine | null>(null);

  // Set up play mode initialization
  useEffect(() => {
    if (mode === 'play' && containerRef.current) {
      if (!engineRef.current) {
        engineRef.current = new GameEngine();
      }
      
      const setupEngine = async () => {
        if (!engineRef.current) return;
        await engineRef.current.init(containerRef.current!);
        const currentObjects = JSON.parse(JSON.stringify(objects));
        engineRef.current.loadScene(currentObjects);
        engineRef.current.start();
      };
      
      setupEngine();

      lastTimeRef.current = performance.now();
      fpsAcc.current = { frames: 0, lastTime: performance.now() };
      gameTimeRef.current = 0;
      setGameTime(0);
      setFps(0);
      
      if (transformControlsRef.current) {
        transformControlsRef.current.detach();
      }
    } else {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      // Returning to edit mode, reattach if needed
      if (selectedId && transformControlsRef.current && objectMeshesRef.current[selectedId]) {
        transformControlsRef.current.attach(objectMeshesRef.current[selectedId]);
      }
    }
  }, [mode]);


  // Load requested assets ahead of time generally
  useEffect(() => {
    let anyLoading = false;
    const updateLoading = (id: string, loaded: number, total: number) => {
      setLoadingAssets(prev => ({ ...prev, [id]: { loaded, total } }));
      setIsAnyLoading(true);
    };
    const finishLoading = (id: string) => {
      setLoadingAssets(prev => {
        const next = { ...prev };
        delete next[id];
        setIsAnyLoading(Object.keys(next).length > 0);
        return next;
      });
    };

    assets.forEach(asset => {
      if ((asset.type === 'image' || asset.type === 'hdr') && !textureCache.current[asset.id]) {
        if(asset.type === 'hdr') {
          // pre-load HDR skipped for brevity, loads dynamically when scene mapped
        } else {
          anyLoading = true;
          setLoadingAssets(prev => ({ ...prev, [asset.id]: { loaded: 0, total: 1 } }));
          new THREE.TextureLoader().load(asset.url, 
            (texture) => {
              texture.colorSpace = THREE.SRGBColorSpace;
              textureCache.current[asset.id] = texture;
              finishLoading(asset.id);
            },
            (xhr) => updateLoading(asset.id, xhr.loaded, xhr.total),
            () => finishLoading(asset.id)
          );
        }
      } else if (asset.type === 'model' && !modelCache.current[asset.id]) {
         anyLoading = true;
         setLoadingAssets(prev => ({ ...prev, [asset.id]: { loaded: 0, total: 1 } }));
         if (asset.url.toLowerCase().endsWith('.obj')) {
           const loader = new OBJLoader();
           let safeUrl = asset.url;
           loader.load(safeUrl, 
             (obj) => {
               modelCache.current[asset.id] = obj;
               finishLoading(asset.id);
             },
             (xhr) => updateLoading(asset.id, xhr.loaded, xhr.total),
             (err) => {
               console.error("Failed to load OBJ:", safeUrl, err);
               finishLoading(asset.id);
             }
           );
         } else {
           const loader = new GLTFLoader();
           let safeUrl = asset.url;
           if (safeUrl.includes('pistol.glb') || safeUrl.includes('gun.glb')) {
             safeUrl = 'https://raw.githubusercontent.com/pmndrs/market-assets/main/files/models/blaster-a/model.gltf';
           } else if (safeUrl.includes('sword.glb')) {
             safeUrl = 'https://raw.githubusercontent.com/pmndrs/market-assets/main/files/models/sword/model.gltf';
           }
           loader.load(safeUrl, 
             (gltf) => {
               gltf.scene.userData.animations = gltf.animations;
               modelCache.current[asset.id] = gltf.scene;
               finishLoading(asset.id);
             },
             (xhr) => updateLoading(asset.id, xhr.loaded, xhr.total),
             (err) => {
               console.error("Failed to load GLTF:", safeUrl, err);
               finishLoading(asset.id);
             }
           );
         }
      }
    });

    if (!anyLoading) {
       setIsAnyLoading(false);
    }
  }, [assets]);

  useEffect(() => {
    const handleScrub = (e: any) => {
      const { id, time } = e.detail;
      if (animationActionsRef.current[id]) {
         const currentObjects = useStore.getState().scenes.find(sc => sc.id === useStore.getState().activeSceneId)?.objects || [];
         const obj = currentObjects.find(o => o.id === id);
         if (obj && obj.animation) {
             const action = animationActionsRef.current[id][obj.animation];
             if (action) action.time = time;
         }
      }
    };
    window.addEventListener('engine-scrub-animation', handleScrub as EventListener);
    return () => window.removeEventListener('engine-scrub-animation', handleScrub as EventListener);
  }, []);

  // Sync objects to Three.js scene
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    
    const currentIds = new Set(objects.map(o => o.id));
    
    // Remove unused
    Object.keys(objectMeshesRef.current).forEach(id => {
      if (!currentIds.has(id)) {
        if (transformControlsRef.current?.object === objectMeshesRef.current[id]) {
           transformControlsRef.current.detach();
        }
        const mesh = objectMeshesRef.current[id];
        scene.remove(mesh);
        if ((mesh as any).geometry) (mesh as any).geometry.dispose();
        if ((mesh as any).material) {
           if (Array.isArray((mesh as any).material)) (mesh as any).material.forEach((m: any) => m.dispose());
           else (mesh as any).material.dispose();
        }
        delete objectMeshesRef.current[id];
      }
    });
    
    // Add or update
    objects.forEach(obj => {
      // Recreate model if it was a fallback and the real model is now loaded
      if (objectMeshesRef.current[obj.id] && objectMeshesRef.current[obj.id].userData.isFallback && obj.geometry === 'model' && obj.modelId && modelCache.current[obj.modelId]) {
         const oldMesh = objectMeshesRef.current[obj.id];
         scene.remove(oldMesh);
         if ((oldMesh as any).geometry) (oldMesh as any).geometry.dispose();
         if ((oldMesh as any).material) (oldMesh as any).material.dispose();
         delete objectMeshesRef.current[obj.id];
      }

      if (!objectMeshesRef.current[obj.id]) {
        if (obj.geometry === 'model' && obj.modelId && modelCache.current[obj.modelId]) {
          const originalModel = modelCache.current[obj.modelId];
          
          let modelGroup: THREE.Object3D;
          if (obj.lods && obj.lods.length > 0) {
            const lod = new THREE.LOD();
            lod.addLevel(originalModel.clone(), 0);
            obj.lods.forEach(l => {
               if (l.modelId && modelCache.current[l.modelId]) {
                 lod.addLevel(modelCache.current[l.modelId].clone(), l.distance);
               }
            });
            modelGroup = lod;
          } else {
            modelGroup = originalModel.clone();
          }

          modelGroup.userData.id = obj.id;
          scene.add(modelGroup);
          objectMeshesRef.current[obj.id] = modelGroup;
          
          if (originalModel.userData.animations && originalModel.userData.animations.length > 0) {
             const mixer = new THREE.AnimationMixer(modelGroup);
             mixersRef.current[obj.id] = mixer;
             const actions: { [name: string]: THREE.AnimationAction } = {};
             originalModel.userData.animations.forEach((clip: THREE.AnimationClip) => {
               actions[clip.name] = mixer.clipAction(clip);
             });
             animationActionsRef.current[obj.id] = actions;
             
             // Play default or first if obj.animation not set yet
             const playbackRate = obj.animation?.playbackRate ?? 1;
             
             if (engineRef.current && mode === 'play') {
                engineRef.current.animation.registerObject(
                  obj.id,
                  modelGroup,
                  originalModel.userData.animations,
                  obj.animation?.graph,
                  obj.animation?.defaultClip
                );
             } else {
                 // Simple editor playback
                 let animToPlay = typeof obj.animation === 'string' ? obj.animation : obj.animation?.defaultClip;
                 if (animToPlay && actions[animToPlay]) {
                   actions[animToPlay].setEffectiveTimeScale(playbackRate);
                   actions[animToPlay].play();
                 } else if (originalModel.userData.animations.length > 0) {
                   actions[originalModel.userData.animations[0].name].setEffectiveTimeScale(playbackRate);
                   actions[originalModel.userData.animations[0].name].play();
                 }
             }
          }
        } else if (obj.geometry === 'pointLight') {
          const lightGroup = new THREE.Group();
          const light = new THREE.PointLight(obj.color, obj.lightProps?.intensity ?? 1, obj.lightProps?.distance ?? 10);
          lightGroup.add(light);
          
          if (mode === 'edit') {
            const helperGeo = new THREE.SphereGeometry(0.2, 8, 8);
            const helperMat = new THREE.MeshBasicMaterial({ color: obj.color, wireframe: true });
            const helper = new THREE.Mesh(helperGeo, helperMat);
            lightGroup.add(helper);
          }
          
          lightGroup.userData.id = obj.id;
          scene.add(lightGroup);
          objectMeshesRef.current[obj.id] = lightGroup;
        } else if (obj.geometry === 'spotLight') {
          const lightGroup = new THREE.Group();
          const light = new THREE.SpotLight(
            obj.color, 
            obj.lightProps?.intensity ?? 1, 
            obj.lightProps?.distance ?? 10,
            obj.lightProps?.angle ?? 0.5,
            obj.lightProps?.penumbra ?? 0.5
          );
          lightGroup.add(light);
          
          if (mode === 'edit') {
            const helperGeo = new THREE.ConeGeometry(0.2, 0.4, 8);
            helperGeo.translate(0, -0.2, 0);
            helperGeo.rotateX(-Math.PI / 2);
            const helperMat = new THREE.MeshBasicMaterial({ color: obj.color, wireframe: true });
            const helper = new THREE.Mesh(helperGeo, helperMat);
            lightGroup.add(helper);
          }
          
          lightGroup.userData.id = obj.id;
          scene.add(lightGroup);
          objectMeshesRef.current[obj.id] = lightGroup;
        } else if (obj.geometry === 'model') {
          // Fallback if model not yet loaded or failed
          const fallbackGeo = new THREE.BoxGeometry(1, 1, 1);
          const fallbackMat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
          const mesh = new THREE.Mesh(fallbackGeo, fallbackMat);
          mesh.userData.id = obj.id;
          mesh.userData.isFallback = true;
          scene.add(mesh);
          objectMeshesRef.current[obj.id] = mesh;
        } else if (obj.geometry === 'group') {
          const group = new THREE.Group();
          group.userData.id = obj.id;
          scene.add(group);
          objectMeshesRef.current[obj.id] = group;
        } else if (obj.geometry === 'particles') {
          const count = obj.particles?.count ?? 1000;
          const spread = obj.particles?.spread ?? 5;
          const size = obj.particles?.size ?? 0.1;

          const geo = new THREE.BufferGeometry();
          const pos = new Float32Array(count * 3);
          const velocities = new Float32Array(count * 3);
          for(let i=0; i<count*3; i++) {
            pos[i] = (Math.random() - 0.5) * spread;
            velocities[i] = (Math.random() - 0.5) * (obj.particles?.speed ?? 1);
          }
          geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
          geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
          
          const mat = new THREE.PointsMaterial({ 
             color: obj.particles?.color ?? obj.color, 
             size, 
             transparent: true, 
             blending: THREE.AdditiveBlending 
          });
          const mesh = new THREE.Points(geo, mat);
          mesh.userData.id = obj.id;
          scene.add(mesh);
          objectMeshesRef.current[obj.id] = mesh;
        } else {
          let geometry;
          if (obj.geometry === 'sphere') geometry = new THREE.SphereGeometry(0.5, 32, 16);
          else if (obj.geometry === 'plane') geometry = new THREE.PlaneGeometry(1, 1);
          else geometry = new THREE.BoxGeometry(1, 1, 1);
          
          const material = new THREE.MeshPhysicalMaterial({ 
            color: (obj.textureId || obj.spriteId) ? 0xffffff : obj.color,
            map: (obj.textureId || obj.spriteId) ? textureCache.current[obj.textureId || obj.spriteId!] || null : null,
            metalness: obj.metalness ?? 0,
            roughness: obj.roughness ?? 0.5,
          });
          
          const mesh = new THREE.Mesh(geometry, material);
          mesh.userData.id = obj.id;
          scene.add(mesh);
          objectMeshesRef.current[obj.id] = mesh;
        }
      }
    });

    // Apply Parent Hierarchy
    objects.forEach(obj => {
       const mesh = objectMeshesRef.current[obj.id];
       if (!mesh) return;

       if (obj.parentId && objectMeshesRef.current[obj.parentId]) {
           const parentMesh = objectMeshesRef.current[obj.parentId];
           if (mesh.parent !== parentMesh) {
             parentMesh.add(mesh);
           }
       } else {
           if (mesh.parent !== sceneRef.current) {
             sceneRef.current?.add(mesh);
           }
       }
    });

    objects.forEach(obj => {
      const mesh = objectMeshesRef.current[obj.id];
      if (!mesh) return;
      
      // Do not sync pos/rot/scale from Zustand if we are currently dragging this exact object via gizmo
      if (!isDraggingGizmo.current || selectedId !== obj.id) {
        mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
        mesh.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
        mesh.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
      }
      
      if (mesh instanceof THREE.Mesh) {
        const mat = mesh.material as any;
        if (mat.color && !(obj.textureId || obj.spriteId)) mat.color.set(obj.color);
        if ('metalness' in mat) mat.metalness = obj.metalness ?? 0;
        if ('roughness' in mat) mat.roughness = obj.roughness ?? 1;
        
        if (mode === 'edit' && obj.id === selectedId) {
          if ('emissive' in mat) mat.emissive.setHex(0x00ff00);
          if ('emissiveIntensity' in mat) mat.emissiveIntensity = 0.5;
        } else {
          if ('emissive' in mat) mat.emissive.setHex(0x000000);
        }
      } else if (obj.geometry === 'pointLight') {
         const light = mesh.children.find(c => c instanceof THREE.PointLight) as THREE.PointLight;
         if (light) {
           light.color.set(obj.color);
           light.intensity = obj.lightProps?.intensity ?? 1;
           light.distance = obj.lightProps?.distance ?? 10;
         }
         if (mode === 'edit') {
           const helper = mesh.children.find(c => c instanceof THREE.Mesh) as THREE.Mesh;
           if (helper) {
              (helper.material as THREE.MeshBasicMaterial).color.set(obj.color);
           }
         }
      } else if (obj.geometry === 'spotLight') {
         const light = mesh.children.find(c => c instanceof THREE.SpotLight) as THREE.SpotLight;
         if (light) {
           light.color.set(obj.color);
           light.intensity = obj.lightProps?.intensity ?? 1;
           light.distance = obj.lightProps?.distance ?? 10;
           light.angle = obj.lightProps?.angle ?? 0.5;
           light.penumbra = obj.lightProps?.penumbra ?? 0.5;
           // Ensure the spotlight is pointing in the direction of negative Z given rotation
           if (!light.target.parent) {
             mesh.add(light.target);
           }
           light.target.position.set(0, 0, -1);
         }
         if (mode === 'edit') {
           const helper = mesh.children.find(c => c instanceof THREE.Mesh) as THREE.Mesh;
           if (helper) {
              (helper.material as THREE.MeshBasicMaterial).color.set(obj.color);
           }
         }
      } else if (obj.geometry === 'model') {
         // Sync animation
         if (mixersRef.current[obj.id] && animationActionsRef.current[obj.id] && obj.animation) {
           const actions = animationActionsRef.current[obj.id];
           const targetAction = actions[obj.animation];
           if (targetAction) {
             Object.values(actions).forEach(action => {
               if (action !== targetAction) action.stop();
             });
             
             if (obj.animationRestart !== mesh.userData.animationRestart) {
                 targetAction.reset().play();
                 mesh.userData.animationRestart = obj.animationRestart;
             } else if (!targetAction.isRunning() && (obj.animationPlaying ?? true)) {
                 targetAction.reset().play();
             }
             
             targetAction.paused = !(obj.animationPlaying ?? true);
             targetAction.setEffectiveTimeScale(obj.animationSpeed ?? 1);
           }
         }
         
         mesh.traverse((child: any) => {
           if (child.isMesh) {
             const mat = child.material;
             if (mat) {
               // Clone the material on the first pass so we don't modify the shared material in the cache
               if (!child.userData.materialCloned) {
                 child.material = mat.clone();
                 child.userData.materialCloned = true;
               }
               const cMat = child.material;
               if (mode === 'edit' && obj.id === selectedId) {
                 if ('emissive' in cMat) cMat.emissive.setHex(0x00ff00);
                 if ('emissiveIntensity' in cMat) cMat.emissiveIntensity = 0.5;
               } else {
                 if ('emissive' in cMat) cMat.emissive.setHex(0x000000);
               }
             }
           }
         });
      }
    });

    if (mode === 'edit' && transformControlsRef.current) {
       if (selectedId && objectMeshesRef.current[selectedId]) {
          transformControlsRef.current.attach(objectMeshesRef.current[selectedId]);
       } else {
          transformControlsRef.current.detach();
       }
    }

  }, [objects, selectedId, mode, assets, isAnyLoading]);

  // Game/Render Loop
  useEffect(() => {
    let playTargetMode = mode;
    const handleStep = () => {
        if (playTargetMode === 'pause') {
            shouldStepRef.current = true;
        }
    };
    window.addEventListener('engine-step-frame', handleStep);

    const loop = (time: number) => {
      requestRef.current = requestAnimationFrame(loop);
      
      let deltaTime = (time - lastTimeRef.current) / 1000;
      if (deltaTime > 0.1) deltaTime = 0.1;
      lastTimeRef.current = time;

      if (controlsRef.current) controlsRef.current.update();

      // Update animations
      if (mode !== 'play') {
          Object.values(mixersRef.current).forEach(mixer => mixer.update(deltaTime));
      }

      // Get current state
      const currentStoreState = useStore.getState();
      const currentActiveScene = currentStoreState.scenes.find(sc => sc.id === currentStoreState.activeSceneId);
      const currentObjects = currentActiveScene?.objects || [];
      const currentSceneConfig = currentActiveScene?.config;

      // Sync Editor Animation State
      if (selectedId && mixersRef.current[selectedId] && animationActionsRef.current[selectedId]) {
         const selObj = currentObjects.find(o => o.id === selectedId);
         if (selObj && selObj.animation) {
             const action = animationActionsRef.current[selectedId][selObj.animation];
             if (action && action.getClip()) {
                 (window as any).__engineAnimationState = (window as any).__engineAnimationState || {};
                 (window as any).__engineAnimationState[selectedId] = {
                     time: action.time,
                     duration: action.getClip().duration
                 };
             }
         }
      }

      const isExecutingPlayLogic = mode === 'play' || (mode === 'pause' && shouldStepRef.current);
      
      // Update particles
      currentObjects.forEach(obj => {
         if (obj.geometry === 'particles') {
            const mesh = objectMeshesRef.current[obj.id] as THREE.Points;
            if (mesh && mesh.geometry instanceof THREE.BufferGeometry) {
               const posAttr = mesh.geometry.attributes.position as THREE.BufferAttribute;
               const velAttr = mesh.geometry.attributes.velocity as THREE.BufferAttribute;
               if (posAttr && velAttr) {
                  const positions = posAttr.array;
                  const velocities = velAttr.array;
                  const speedMultiplier = isExecutingPlayLogic ? 1 : 0.2;
                  const spread = obj.particles?.spread ?? 5;
                  for (let i = 0; i < positions.length; i+=3) {
                     positions[i] += velocities[i] * deltaTime * speedMultiplier;
                     positions[i+1] += velocities[i+1] * deltaTime * speedMultiplier;
                     positions[i+2] += velocities[i+2] * deltaTime * speedMultiplier;
                     
                     if (Math.abs(positions[i]) > spread/2) positions[i] *= -0.9;
                     if (Math.abs(positions[i+1]) > spread/2) positions[i+1] *= -0.9;
                     if (Math.abs(positions[i+2]) > spread/2) positions[i+2] *= -0.9;
                  }
                  posAttr.needsUpdate = true;
               }
            }
         }
      });

      if (isExecutingPlayLogic) {
        if (shouldStepRef.current) deltaTime = 1/60; // Fixed timestep for manual step
        gameTimeRef.current += deltaTime;
        fpsAcc.current.frames++;
        if (time - fpsAcc.current.lastTime >= 1000) {
          setFps(fpsAcc.current.frames);
          setGameTime(gameTimeRef.current);
          fpsAcc.current.frames = 0;
          fpsAcc.current.lastTime = time;
        }

        // Map Keys to Actions based on scene config
        const mappedActions: Record<string, boolean> = {};
        if (currentSceneConfig?.inputMappings) {
          for (const [action, keys] of Object.entries(currentSceneConfig.inputMappings)) {
            mappedActions[action] = keys.some(key => inputState.keys[key] || inputState.keys[key.replace('Key', '')] || inputState.keys[key.replace('Arrow', '')]);
          }
        }
        (inputState as any).actions = mappedActions;

        // GameEngine sync
        if (engineRef.current) {
          engineRef.current.update(deltaTime);
          const transforms = engineRef.current.getVisualTransforms();
          
          for (const [id, t] of Object.entries(transforms)) {
              const mesh = objectMeshesRef.current[id];
              if (mesh) {
                mesh.position.set(t.position.x, t.position.y, t.position.z);
                const q = new THREE.Quaternion(t.rotation.x, t.rotation.y, t.rotation.z, t.rotation.w);
                mesh.quaternion.copy(q);
              }
          }

          // Sync Camera
          const mainCamTrans = engineRef.current.getMainCameraTransform();
          if (mainCamTrans && cameraRef.current) {
             cameraRef.current.position.set(mainCamTrans.position.x, mainCamTrans.position.y, mainCamTrans.position.z);
             const q = new THREE.Quaternion(mainCamTrans.rotation.x, mainCamTrans.rotation.y, mainCamTrans.rotation.z, mainCamTrans.rotation.w);
             cameraRef.current.quaternion.copy(q);
          }
        }

      }

      // Update Debug Physics Colliders
      if (currentSceneConfig?.showPhysicsColliders && sceneRef.current) {
         currentObjects.forEach(obj => {
            if (obj.physics?.enabled) {
                let helper = physicsHelpersRef.current[obj.id];
                if (!helper) {
                     const mesh = objectMeshesRef.current[obj.id];
                     if (mesh) {
                         helper = new THREE.BoxHelper(mesh, 0xff0000);
                         sceneRef.current!.add(helper);
                         physicsHelpersRef.current[obj.id] = helper;
                     }
                } else {
                     helper.update();
                }
            } else if (physicsHelpersRef.current[obj.id]) {
                sceneRef.current!.remove(physicsHelpersRef.current[obj.id]);
                delete physicsHelpersRef.current[obj.id];
            }
         });
      } else {
         Object.values(physicsHelpersRef.current).forEach(helper => {
             sceneRef.current?.remove(helper);
         });
         physicsHelpersRef.current = {};
      }

      if (isExecutingPlayLogic) {
          shouldStepRef.current = false;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        if (composerRef.current) {
          composerRef.current.render();
        } else {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      }
    };
    
    requestRef.current = requestAnimationFrame(loop);
    return () => {
        cancelAnimationFrame(requestRef.current!);
        window.removeEventListener('engine-step-frame', handleStep);
    }
  }, [mode, dimensions]);

  // Edit Mode Interaction
  const handlePointerDown = (e: React.PointerEvent) => {
    if (mode !== 'edit' || !cameraRef.current || !rendererRef.current || !sceneRef.current) return;
    
    if (e.button !== 0 || e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) return;
    
    // Don't select objects if we are interacting with the gizmo
    if (transformControlsRef.current?.dragging) return;

    const rect = rendererRef.current.domElement.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.current.setFromCamera(mouse.current, cameraRef.current);
    
    const interactables: THREE.Object3D[] = [];
    Object.values(objectMeshesRef.current).forEach(obj => {
       interactables.push(obj);
    });
    
    const intersects = raycaster.current.intersectObjects(interactables, true);
    
    if (intersects.length > 0) {
      let rootObj: THREE.Object3D | null = intersects[0].object;
      while (rootObj && !rootObj.userData.id) {
        rootObj = rootObj.parent;
      }
      
      if (rootObj && rootObj.userData.id) {
         if (selectedId !== rootObj.userData.id) {
            selectObject(rootObj.userData.id);
         }
      }
    } else {
      selectObject(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (mode === 'edit') {
      e.preventDefault();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (mode !== 'edit' || !cameraRef.current || !rendererRef.current) return;
    try {
      const prefabStr = e.dataTransfer.getData('engine-prefab');
      const modelStr = e.dataTransfer.getData('engine-model');
      
      let objToAdd: any = null;
      let isPrefab = false;
      let prefabNode: any = null;

      if (prefabStr) {
          const prefabData = JSON.parse(prefabStr);
          if (prefabData && prefabData.obj) {
              isPrefab = true;
              prefabNode = prefabData;
          }
      } else if (modelStr) {
          const modelData = JSON.parse(modelStr);
          if (modelData) {
              objToAdd = {
                  name: modelData.name,
                  geometry: 'model',
                  textureId: modelData.id,
                  position: { x: 0, y: 0, z: 0 },
                  rotation: { x: 0, y: 0, z: 0 },
                  scale: { x: 1, y: 1, z: 1 },
                  color: '#ffffff'
              };
          }
      }

      if (isPrefab || objToAdd) {
          const rect = rendererRef.current.domElement.getBoundingClientRect();
          mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.current.setFromCamera(mouse.current, cameraRef.current);
          
          // Simple drop intersection with Z=0 plane
          const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const target = new THREE.Vector3();
          raycaster.current.ray.intersectPlane(plane, target);
          
          if (target) {
              const { addObject } = useStore.getState();
              
              if (isPrefab) {
                  const addHierarchy = (node: any, parentId?: string) => {
                      const newId = Math.random().toString(36).substring(2, 9);
                      const clonedObj = { ...node.obj, id: newId, parentId };
                      if (!parentId) {
                          clonedObj.position = { x: target.x, y: target.y, z: target.z };
                      }
                      addObject(clonedObj);
                      if (node.children && node.children.length > 0) {
                          node.children.forEach((child: any) => addHierarchy(child, newId));
                      }
                  };
                  addHierarchy(prefabNode);
              } else {
                  objToAdd.position = { x: target.x, y: target.y, z: target.z };
                  addObject(objToAdd);
              }
          }
      }
    } catch(e) {
      console.error("Failed to drop prefab", e);
    }
  };

  return (
    <div 
      className="flex-1 w-full bg-zinc-900 overflow-hidden relative cursor-crosshair"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {mode === 'edit' && (
        <div className="absolute top-4 left-4 bg-zinc-950/80 backdrop-blur text-zinc-400 text-xs px-3 py-1.5 border border-zinc-800 rounded shadow-md pointer-events-none flex flex-col gap-1">
          <span>EDIT MODE - Blender Controls</span>
          <span className="text-[10px] text-zinc-500">Left Click: Select Object | MMB: Orbit | Shift+MMB: Pan | Scroll: Zoom</span>
          <span className="text-[10px] text-zinc-500 mt-1">G: Translate | R: Rotate | S: Scale | X/Del: Delete</span>
        </div>
      )}
      
      {mode === 'edit' && (
        <div className="absolute top-4 left-4 bg-zinc-900 border border-zinc-800 rounded-md flex flex-col overflow-hidden pointer-events-auto">
          <div className="flex">
            <button 
              className={`p-2 hover:bg-zinc-800 ${transformMode === 'translate' ? 'bg-zinc-800 text-blue-400' : 'text-zinc-400'}`}
              onClick={() => setTransformMode('translate')}
              title="Translate (G)"
            ><Move className="w-4 h-4" /></button>
            <button 
              className={`p-2 hover:bg-zinc-800 ${transformMode === 'rotate' ? 'bg-zinc-800 text-blue-400' : 'text-zinc-400'}`}
              onClick={() => setTransformMode('rotate')}
              title="Rotate (R)"
            ><RotateCw className="w-4 h-4" /></button>
            <button 
              className={`p-2 hover:bg-zinc-800 ${transformMode === 'scale' ? 'bg-zinc-800 text-blue-400' : 'text-zinc-400'}`}
              onClick={() => setTransformMode('scale')}
              title="Scale (S)"
            ><Scaling className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center px-2 py-1 bg-zinc-950 border-t border-zinc-800 gap-2">
            <input 
               type="checkbox" 
               checked={snapEnabled} 
               onChange={(e) => setSnapEnabled(e.target.checked)} 
               className="w-3 h-3"
               title="Enable Snapping"
            />
            <span className="text-[10px] text-zinc-500 font-mono">SNAP</span>
          </div>
        </div>
      )}
      
      {mode === 'play' && (
         <div className="absolute top-4 left-4 flex gap-3">
          <div className="bg-[#00FF00]/10 text-[#00FF00] text-xs px-3 py-2 border border-[#00FF00]/30 rounded shadow-[0_0_15px_rgba(0,255,0,0.1)] pointer-events-none uppercase font-bold tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FF00] animate-pulse"></span>
            Running Live
          </div>
          <div className="bg-zinc-950/80 backdrop-blur text-zinc-100 text-xs px-3 py-2 border border-zinc-800 rounded shadow-md pointer-events-none font-mono flex gap-4">
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[10px] uppercase">FPS</span>
              <span className="text-[#00FF00] font-bold">{fps}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[10px] uppercase">Time</span>
              <span>{gameTime.toFixed(1)}s</span>
            </div>
            {rendererRef.current && (
              <>
                <div className="flex flex-col border-l border-zinc-700 pl-3">
                  <span className="text-zinc-500 text-[10px] uppercase">Draw Calls</span>
                  <span className="text-amber-400">{rendererRef.current.info.render.calls}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-zinc-500 text-[10px] uppercase">Tris</span>
                  <span className="text-cyan-400">{(rendererRef.current.info.render.triangles / 1000).toFixed(1)}k</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isAnyLoading && (
        <div className="absolute bottom-4 right-4 bg-zinc-950/80 backdrop-blur border border-zinc-800 p-4 rounded shadow-lg select-none pointer-events-none w-64">
          <div className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest flex items-center gap-2">
            <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading Assets
          </div>
          <div className="space-y-2">
            {Object.entries(loadingAssets).map(([id, progress]) => {
              const asset = assets.find(a => a.id === id);
              const percent = progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0;
              return (
                <div key={id} className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] text-zinc-500 truncate">
                    <span className="truncate">{asset?.name || 'Unknown Asset'}</span>
                    <span>{Math.round(percent)}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                    <div className="bg-blue-500 h-1 transition-all duration-300" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

