import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';

export interface RendererOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  pixelRatio: number;
}

export class Renderer {
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  
  private renderPass!: RenderPass;
  private bloomPass!: UnrealBloomPass;
  private ssaoPass!: SSAOPass;

  private isWireframe: boolean = false;
  private isDeferred: boolean = false;
  
  constructor(options: RendererOptions) {
    // Initialize standard Vulkan/WebGPU/WebGL capabilities
    this.renderer = new THREE.WebGLRenderer({
      canvas: options.canvas,
      antialias: false, // Disabled for advanced post-processing / deferred
      alpha: false,
      powerPreference: 'high-performance',
      stencil: true,
      depth: true
    });

    this.renderer.setSize(options.width, options.height);
    this.renderer.setPixelRatio(options.pixelRatio);

    // Modern AAA color workflow
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Advanced capabilities
    this.renderer.localClippingEnabled = true;
    
    // Initialize Render Graph / Post Processing
    this.composer = new EffectComposer(this.renderer);
  }

  public initRenderGraph(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.composer.passes = []; // Clear old passes

    // 1. Base Geometry Pass (Forward/Deferred basis)
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    // 2. SSAO Pass (Screen Space Ambient Occlusion)
    this.ssaoPass = new SSAOPass(scene, camera, this.renderer.domElement.width, this.renderer.domElement.height);
    this.ssaoPass.kernelRadius = 16;
    this.ssaoPass.minDistance = 0.005;
    this.ssaoPass.maxDistance = 0.1;
    this.composer.addPass(this.ssaoPass);

    // 3. HDR Bloom Pass
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.2, // strength
      0.4, // radius
      0.85 // threshold
    );
    this.composer.addPass(this.bloomPass);

    // 4. Gamma Correction / Tonemapping resolution
    const gammaPass = new ShaderPass(GammaCorrectionShader);
    this.composer.addPass(gammaPass);
  }

  public resize(width: number, height: number, pixelRatio: number = 1) {
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(pixelRatio);
    this.composer.setSize(width, height);
    if (this.bloomPass) {
        this.bloomPass.resolution.set(width, height);
    }
  }

  public render(scene: THREE.Scene, camera: THREE.Camera, deltaTime: number) {
    // Execute Render Graph
    this.composer.render(deltaTime);
  }

  public getRawRenderer() {
    return this.renderer;
  }

  public setQualitySettings(quality: 'low' | 'medium' | 'high' | 'ultra') {
    switch (quality) {
      case 'low':
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        this.bloomPass.enabled = false;
        this.ssaoPass.enabled = false;
        break;
      case 'ultra':
      case 'high':
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.bloomPass.enabled = true;
        this.ssaoPass.enabled = true;
        break;
    }
  }
}
