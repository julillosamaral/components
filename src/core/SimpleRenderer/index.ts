import * as THREE from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import {
  Event,
  Disposable,
  Updateable,
  Resizeable,
  BaseRenderer,
} from "../../base-types";
import { Components } from "../Components";

/**
 * A basic renderer capable of rendering 3D and 2D objects
 * ([Objec3Ds](https://threejs.org/docs/#api/en/core/Object3D) and
 * [CSS2DObjects](https://threejs.org/docs/#examples/en/renderers/CSS2DRenderer)
 * respectively).
 */
export class SimpleRenderer
  extends BaseRenderer
  implements Disposable, Updateable, Resizeable
{
  /** {@link Component.name} */
  name = "SimpleRenderer";

  /** {@link Component.enabled} */
  enabled = true;

  /** The HTML container of the THREE.js canvas where the scene is rendered. */
  container: HTMLElement;

  /** {@link Updateable.onBeforeUpdate} */
  readonly onBeforeUpdate = new Event<SimpleRenderer>();

  /** {@link Updateable.onAfterUpdate} */
  readonly onAfterUpdate = new Event<SimpleRenderer>();

  protected _renderer2D = new CSS2DRenderer();
  protected _renderer: THREE.WebGLRenderer;

  overrideScene?: THREE.Scene;
  overrideCamera?: THREE.Camera;

  constructor(
    components: Components,
    container: HTMLElement,
    parameters?: Partial<THREE.WebGLRendererParameters>
  ) {
    super(components);
    this.container = container;

    this._renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      ...parameters,
    });

    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.setupRenderers();
    this.setupEvents(true);
    this.resize();
  }

  /** {@link Component.get} */
  get() {
    return this._renderer;
  }

  /** {@link Updateable.update} */
  update(_delta: number) {
    if (!this.enabled) return;
    this.onBeforeUpdate.trigger(this);
    if (this.overrideScene && this.overrideCamera) {
      this._renderer.render(this.overrideScene, this.overrideCamera);
      this._renderer2D.render(this.overrideScene, this.overrideCamera);
    } else {
      const scene = this.components.scene.get();
      const camera = this.components.camera.get();
      if (!scene || !camera) return;
      this._renderer.render(scene, camera);
      this._renderer2D.render(scene, camera);
    }
    this.onAfterUpdate.trigger(this);
  }

  /** {@link Disposable.dispose} */
  async dispose() {
    this.enabled = false;
    this.setupEvents(false);
    this._renderer.domElement.remove();
    this._renderer.dispose();
    this._renderer2D.domElement.remove();
    this.onResize.reset();
    this.onAfterUpdate.reset();
    this.onBeforeUpdate.reset();
  }

  /** {@link Resizeable.getSize}. */
  getSize() {
    return new THREE.Vector2(
      this._renderer.domElement.clientWidth,
      this._renderer.domElement.clientHeight
    );
  }

  /** {@link Resizeable.resize}. */
  resize = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this._renderer.setSize(width, height);
    this._renderer2D.setSize(width, height);
    this.onResize.trigger();
  };

  setupEvents(active: boolean) {
    if (active) {
      window.addEventListener("resize", this.resize);
    } else {
      window.removeEventListener("resize", this.resize);
    }
  }

  private setupRenderers() {
    this._renderer.localClippingEnabled = true;
    this.container.appendChild(this._renderer.domElement);

    this._renderer2D.domElement.style.position = "absolute";
    this._renderer2D.domElement.style.top = "0px";
    this._renderer2D.domElement.style.pointerEvents = "none";
    this.container.appendChild(this._renderer2D.domElement);
  }
}
