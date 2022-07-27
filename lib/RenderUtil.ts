import * as Hilo3d from 'hilo3d';

export class RenderUtil {
  private static _canvas: HTMLCanvasElement;
  public static get canvas(): HTMLCanvasElement {
    if (!this._canvas) {
      this._canvas = document.createElement('canvas');
    }

    return this._canvas;
  }

  private static _canvasCtx2d: CanvasRenderingContext2D;
  public static get canvasCtx2d(): CanvasRenderingContext2D {
    if (!this._canvasCtx2d) {
      this._canvasCtx2d = this.canvas.getContext('2d')!;
    }
    return this._canvasCtx2d;
  }

  public static renderMeshToFramebuffer(
    stage: Hilo3d.Stage,
    sprite: Hilo3d.Mesh,
    camera: Hilo3d.Camera,
    framebuffer: Hilo3d.Framebuffer,
    clearColor: Hilo3d.Color = new Hilo3d.Color(0, 0, 0, 0)
  ) {
    if (sprite && camera && framebuffer) {
      const renderer = stage.renderer;
      const currentCamera = Hilo3d.semantic.camera;
      framebuffer.bind();
      renderer.state.viewport(
        0,
        0,
        framebuffer.texture.width,
        framebuffer.texture.height
      );
      renderer.clear(clearColor);
      camera.updateViewProjectionMatrix();
      Hilo3d.semantic.setCamera(camera);
      renderer.renderMesh(sprite);
      framebuffer.unbind();
      Hilo3d.semantic.setCamera(currentCamera);
      renderer.viewport();
    }
  }

  public static framebufferToBase64(
    framebuffer: Hilo3d.Framebuffer,
    imageType = 'image/png',
    quality = 0.92
  ) {
    const canvas = this.canvas;
    const ctx = this.canvasCtx2d;

    const width = Math.floor(framebuffer.texture.width);
    const height = Math.floor(framebuffer.texture.height);

    canvas.width = width;
    canvas.height = height;
    const dt = framebuffer.readPixels(0, 0, width, height);
    const imageData = new ImageData(width, height);
    const lineLen: number = width * 4;
    const dst: Uint8ClampedArray = imageData.data;
    let y: number = height - 1;
    let off: number = y * lineLen;
    let srcoff = 0;
    for (; y >= 0; y--) {
      dst.set(dt.subarray(srcoff, srcoff + lineLen), off);
      off -= lineLen;
      srcoff += lineLen;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL(imageType, quality);
  }

  public static renderNodeToFramebuffer(
    stage: Hilo3d.Stage,
    node: Hilo3d.Node,
    camera: Hilo3d.Camera,
    framebuffer: Hilo3d.Framebuffer,
    clearColor: Hilo3d.Color = new Hilo3d.Color(1, 1, 1, 0),
    needUpdate = true
  ) {
    const renderer = stage.renderer;

    if (needUpdate) {
      node.traverseUpdate(0.16);
    }
    framebuffer.bind();
    renderer.state.viewport(
      0,
      0,
      framebuffer.texture.width,
      framebuffer.texture.height
    );

    const currentCamera = Hilo3d.semantic.camera;
    const currentClearColor = renderer.clearColor;

    renderer.clearColor = clearColor;
    renderer.render(node, camera, false);
    framebuffer.unbind();
    renderer.viewport();
    renderer.clearColor = currentClearColor;
    Hilo3d.semantic.setCamera(currentCamera);

    const renderInfo = renderer.renderInfo;
    renderInfo.addDrawCount(renderInfo.drawCount);
    renderInfo.addFaceCount(renderInfo.faceCount);
  }
}
