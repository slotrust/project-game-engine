export type EventHandler = (...args: any[]) => void;

export class EventDispatcher {
  private events: Map<string, EventHandler[]> = new Map();

  public subscribe(eventName: string, handler: EventHandler): void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)!.push(handler);
  }

  public unsubscribe(eventName: string, handler: EventHandler): void {
    if (!this.events.has(eventName)) return;
    
    const handlers = this.events.get(eventName)!;
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  public dispatch(eventName: string, ...args: any[]): void {
    if (!this.events.has(eventName)) return;
    
    const handlers = this.events.get(eventName)!;
    for (const handler of handlers) {
      handler(...args);
    }
  }
}
