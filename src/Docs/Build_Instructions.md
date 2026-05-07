# Engine Build Instructions

This engine is built on **TypeScript + WebGL/WebGPU (via Three.js)** for complete cross-platform browser support, matching the architectural patterns of C++20 AAA engines (such as Unreal Engine 5).

## Tech Stack Mapping
| C++ AAA Engine | This Engine (TypeScript) | 
| :--- | :--- |
| Vulkan / DirectX 12 | WebGPU / WebGL (via Three.js) |
| C++20 | TypeScript 5 |
| GLFW / SDL2 | Browser DOM / React Viewport |
| EnTT | Custom TS ECS (`src/Engine/Core/ECS.ts`) |
| Jolt / PhysX | Cannon-es (`src/Engine/Physics/index.ts`) |
| ImGui | React + Tailwind + Radix UI (Node-based editor UI) |

## Build instructions

### Development Mode (Editor)
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
```

The output will be placed in the `/dist` directory.

## Architecture

This project is structured identically to a major C++ Engine:
- `GameEngine/Engine/Core/`: Holds the EventDispatcher, Subsystem Initializers, Time logic, logging, and an Entity-Component System (ECS).
- `GameEngine/Engine/Renderer/`: Holds the render pipeline management.
- `GameEngine/Editor/`: React components defining Outliner, Inspector, Content Browser.

## Extensibility

To add a new component to the ECS:
1. Extend `Component` from `ECS.ts`.
2. Add it to an Entity.
3. Create a class extending `System` from `ECS.ts` to process your logic!
