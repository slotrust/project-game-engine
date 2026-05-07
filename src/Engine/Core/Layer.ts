export abstract class Layer {
  public name: string;
  constructor(name: string = 'Layer') {
    this.name = name;
  }

  onAttach(): void {}
  onDetach(): void {}
  onUpdate(deltaTime: number): void {}
  onEvent(event: any): void {}
}
