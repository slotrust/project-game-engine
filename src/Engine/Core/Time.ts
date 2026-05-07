export class Time {
  private static _deltaTime: number = 0;
  private static _totalTime: number = 0;
  private static _lastFrameTime: number = 0;

  static init() {
    this._lastFrameTime = performance.now() / 1000.0;
  }

  static tick() {
    const currentTime = performance.now() / 1000.0;
    this._deltaTime = currentTime - this._lastFrameTime;
    this._lastFrameTime = currentTime;
    this._totalTime += this._deltaTime;
  }

  static get deltaTime(): number {
    return this._deltaTime;
  }

  static get totalTime(): number {
    return this._totalTime;
  }
}
