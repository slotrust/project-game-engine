import { Layer } from './Layer';

export class LayerStack {
  private layers: Layer[] = [];
  private layerInsertIndex: number = 0;

  pushLayer(layer: Layer) {
    this.layers.splice(this.layerInsertIndex, 0, layer);
    this.layerInsertIndex++;
    layer.onAttach();
  }

  pushOverlay(overlay: Layer) {
    this.layers.push(overlay);
    overlay.onAttach();
  }

  popLayer(layer: Layer) {
    const it = this.layers.indexOf(layer);
    if (it !== -1 && it < this.layerInsertIndex) {
      layer.onDetach();
      this.layers.splice(it, 1);
      this.layerInsertIndex--;
    }
  }

  popOverlay(overlay: Layer) {
    const it = this.layers.indexOf(overlay);
    if (it !== -1 && it >= this.layerInsertIndex) {
      overlay.onDetach();
      this.layers.splice(it, 1);
    }
  }

  getLayers(): Layer[] {
    return this.layers;
  }
}
