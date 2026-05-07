export class MemoryTracker {
  private static allocations: Map<string, number> = new Map();
  private static totalAllocated: number = 0;
  private static activeObjects: Set<any> = new Set();

  static trackAlloc(tag: string, size: number) {
    const current = this.allocations.get(tag) || 0;
    this.allocations.set(tag, current + size);
    this.totalAllocated += size;
  }

  static trackFree(tag: string, size: number) {
    const current = this.allocations.get(tag) || 0;
    this.allocations.set(tag, Math.max(0, current - size));
    this.totalAllocated = Math.max(0, this.totalAllocated - size);
  }

  static trackObject(obj: any) {
    this.activeObjects.add(obj);
  }

  static untrackObject(obj: any) {
    this.activeObjects.delete(obj);
  }

  static getStats() {
    return {
      totalBytes: this.totalAllocated,
      activeObjectsCount: this.activeObjects.size,
      allocationsByTag: Object.fromEntries(this.allocations)
    };
  }
}
