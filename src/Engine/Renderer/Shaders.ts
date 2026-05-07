export const PBR_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    gl_Position = projectionMatrix * mvPosition;
}
`;

export const PBR_FRAGMENT_SHADER = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

uniform vec3 baseColor;
uniform float roughness;
uniform float metallic;

// Simplified GGX / PBR placeholder logic
// In a full WebGLRenderer integration, we'd use THREE.ShaderChunk
void main() {
    // Normalization
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    // Very basic environment reflection fake 
    float NdotV = max(dot(normal, viewDir), 0.0);
    
    // F0 approx
    vec3 f0 = vec3(0.04);
    f0 = mix(f0, baseColor, metallic);
    
    // Output calculation
    vec3 finalColor = baseColor * (1.0 - metallic) + f0 * NdotV * (1.0 - roughness);
    
    gl_FragColor = vec4(finalColor, 1.0);
    
    #include <tonemapping_fragment>
    #include <encodings_fragment>
}
`;

// Represents a pre-compiled shader object
export class ShaderProgram {
    public vertexSrc: string;
    public fragmentSrc: string;

    constructor(vert: string, frag: string) {
        this.vertexSrc = vert;
        this.fragmentSrc = frag;
    }

    public recompile(newVert?: string, newFrag?: string) {
        if (newVert) this.vertexSrc = newVert;
        if (newFrag) this.fragmentSrc = newFrag;
        // In a true custom Vulkan backend, trigger pipeline recreation here.
    }
}
