export class InputSystem {
  private keys: Set<string> = new Set();
  private mouseButtons: Set<number> = new Set();
  private mousePosition = { x: 0, y: 0 };
  private mouseDelta = { x: 0, y: 0 };
  private actionBindings: Record<string, string[]> = {};

  constructor(private domElement: HTMLElement) {
    this.setupListeners();
  }

  private setupListeners() {
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    
    this.domElement.addEventListener('mousedown', (e) => {
      this.mouseButtons.add(e.button);
    });
    this.domElement.addEventListener('mouseup', (e) => {
      this.mouseButtons.delete(e.button);
    });
    this.domElement.addEventListener('mousemove', (e) => {
      this.mousePosition.x = e.clientX;
      this.mousePosition.y = e.clientY;
      this.mouseDelta.x += e.movementX;
      this.mouseDelta.y += e.movementY;
    });
    // prevent right click menu
    this.domElement.addEventListener('contextmenu', e => e.preventDefault());
  }

  bindAction(action: string, codes: string[]) {
    this.actionBindings[action] = codes;
  }

  isActionPressed(action: string): boolean {
    const codes = this.actionBindings[action];
    if (!codes) return false;
    return codes.some(code => this.keys.has(code) || (code.startsWith('Mouse') && this.mouseButtons.has(parseInt(code.replace('Mouse', '')))));
  }

  isKeyPressed(code: string): boolean {
    return this.keys.has(code);
  }

  getMouseDelta() {
    return { ...this.mouseDelta };
  }

  resetFrame() {
    this.mouseDelta = { x: 0, y: 0 };
  }

  dispose() {
    // cleanup listeners...
  }
}
