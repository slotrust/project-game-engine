import { EventDispatcher } from './EventDispatcher';

export class Input {
  private static keys: Set<string> = new Set();
  private static mouseButtons: Set<number> = new Set();
  private static mousePos = { x: 0, y: 0 };

  public static init() {
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('mousedown', (e) => this.mouseButtons.add(e.button));
    window.addEventListener('mouseup', (e) => this.mouseButtons.delete(e.button));
    window.addEventListener('mousemove', (e) => {
      this.mousePos.x = e.clientX;
      this.mousePos.y = e.clientY;
    });
  }

  public static isKeyPressed(keyCode: string): boolean {
    return this.keys.has(keyCode);
  }

  public static isMouseButtonPressed(button: number): boolean {
    return this.mouseButtons.has(button);
  }

  public static getMousePosition() {
    return this.mousePos;
  }
}
