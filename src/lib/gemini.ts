import { GoogleGenAI, Type } from '@google/genai';

let ai: GoogleGenAI | null = null;

export function getAI() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY environment variable.');
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

export async function generateScriptForObject(
  objectName: string, 
  objectScript: string, 
  requestText: string
): Promise<string> {
  const model = 'gemini-3.1-pro-preview';
  
  const systemInstruction = `You are an expert AI game coder integrated into a WebGL 3D web game engine. 
Your job is to write or modify a JavaScript file containing an 'update' function for a specific GameObject.

The engine calls this function every frame:
function update(gameObject, input, window, deltaTime) {
  // your logic
}

Variables available to you:
- gameObject: { id, name, position: {x,y,z}, rotation: {x,y,z}, scale: {x,y,z}, color } (modify these directly to move or change the object)
- input: { keys: { [key: string]: boolean } } (e.g., input.keys['Space'], input.keys['ArrowRight'])
- window: { width: number, height: number } (useful for aspect ratio or bounds)
- deltaTime: number (seconds since last frame, use for smooth movement: speed * deltaTime)

IMPORTANT:
- Output ONLY valid JavaScript code.
- Must include the 'function update(...)' definition.
- If the user asks to modify existing behavior, you must merge it into the existing script.
- DO NOT use markdown code blocks (\`\`\`javascript) in your response, ONLY the raw javascript string.
`;

  const prompt = `
Current Object Name: ${objectName}

Existing Script:
\`\`\`javascript
${objectScript}
\`\`\`

User Request: "${requestText}"

Please provide the FULL completely updated JavaScript \`update\` function. Only output the function code.
`;

  const aiClient = getAI();
  const response = await aiClient.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
    }
  });

  let text = response.text || '';
  // Strip markdown formatting if any
  if (text.startsWith('```javascript')) {
    text = text.replace(/^```javascript\n?/, '').replace(/\n?```$/, '');
  } else if (text.startsWith('```js')) {
    text = text.replace(/^```js\n?/, '').replace(/\n?```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  return text.trim();
}

export async function executeSceneCommand(
  requestText: string,
  sceneState: any
): Promise<{ 
  message: string, 
  commands: {
    type: 'add' | 'update' | 'delete' | 'updateConfig' | 'addAsset',
    id?: string,
    data?: any
  }[]
}> {
  const model = 'gemini-3.1-pro-preview';

  const systemInstruction = `You are an elite, Senior Game Engine Architect and AI Agent (specializing in Unreal Engine 5, Unity, and Roblox). 
You manipulate a WebGL scene and write advanced gameplay logic using the 'update' script functionality.
You can add free placeholder assets (3D models, textures, or even music/sounds) by using known free placeholder asset URLs (.glb, .gltf, .hdr, .png, .jpg, .mp3, .wav).

You MUST respond with a JSON object exactly matching this format:
{
  "message": "A professional explanation of the actions taken and logic implemented.",
  "commands": [
    { "type": "addAsset", "data": { "id": "my_asset_1", "name": "Asset Name", "type": "model|image|hdr|sound", "url": "https://url.to/raw/file.glb" } },
    { "type": "add", "data": { "name": "...", "geometry": "box|sphere|plane|pointLight|spotLight|model", "modelId": "my_asset_1", "textureId": "my_asset_1", "position": {"x":0,"y":0,"z":0}, "color": "#ffffff", "script": "" } },
    { "type": "update", "id": "...", "data": { "position": {"x":1,"y":0,"z":0}, "script": "advanced javascript logic..." } },
    { "type": "delete", "id": "..." },
    { "type": "updateConfig", "data": { "ambientLightColor": "#ffffff", "ambientLightIntensity": 1.0, "bloomEnabled": true, "skyboxUrl": "https://..." } }
  ]
}

- For geometry: box, sphere, plane, pointLight, spotLight, model.
- Keep in mind that 'position', 'rotation', 'scale' use {x,y,z}.
- If generating music/sound, add an 'addAsset' command with type 'sound' and a valid url you found from searching for free audio. (Note: Since we are a visual engine without an audio player, adding an asset is exactly what is needed for now).
- When writing Scripts ('script' field in 'add' or 'update'), act like a veteran Roblox/Unity programmer. Use deltaTime, physics calculations, input.keys, and smooth interpolations.
- Please DO NOT hallucinate IDs; only use IDs from the provided sceneState for 'update' or 'delete'.
- Only respond in valid JSON matching the schema.`;

  const prompt = `Current Scene State:\n${JSON.stringify(sceneState, null, 2)}\n\nUser Request: "${requestText}"\n\nGenerate the JSON actions.`;

  const aiClient = getAI();
  const response = await aiClient.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
    }
  });

  let text = response.text || '{}';
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Agent JSON parsing failed", text, e);
    return { message: 'Failed to parse JSON response', commands: [] };
  }
}

