# Unreal Engine 5 Inspired Renderer Architecture

This engine utilizes a modern PBR rendering pipeline mapped to standard WebGL/WebGPU structures to work in a browser environment, while following Vulkan-esque memory & capability abstractions.

## Features Mapped
| UE5 Concept | Implementation in this Engine |
| :--- | :--- |
| Deferred Rendering Pipeline | WebGL Deferred / RenderGraph.ts (`three/examples/jsm/renderers/webgl/WebGLDeferredRenderer` / EffectComposer) |
| Vulkan Initialization | `Renderer.ts` (WebGLRenderer abstraction / config) |
| Cascaded Shadow Maps | `LightSystem.ts` with PCFSoftShadowMap & Bias mapping |
| Physical Material (PBR) | `MaterialSystem.ts` using GGX BDRF & custom GLSL (`MeshPhysicalMaterial`) |
| Asset Importing (Assimp) | `AssetManager.ts` extracting `.gltf`/`.obj` & parsing hierarchy |
| Render Graph | `RenderGraph.ts` tracking render pass dependencies |
| GPU Memory Allocator | `GPUAllocator.ts` tracking tracked allocations & estimates |
| Multithreading | Scheduled via `JobSystem.ts` (Pre-compilation and loading separated) |

## Render Graph Features 
The `Renderer` initializes the graph natively:
- **Pass 0**: Base BaseColor, Normal, Depth (GBuffer-alike)
- **Pass 1**: Screen Space Ambient Occlusion (`SSAOPass`)
- **Pass 2**: HDR Tonemapping & Unreal Bloom (`UnrealBloomPass`)

## Shader System
Custom generic GLSL fragments are provided in `Shaders.ts` and managed by the `MaterialSystem`, permitting hot reload logic `hotReloadShader(id, vert, frag)` corresponding to pipeline recreation.
