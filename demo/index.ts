import * as Hilo3d from 'hilo3d';
import { GLTFExporter } from '../lib/';
import { quat } from './utils';

let stage: Hilo3d.Stage;
let camera: Hilo3d.Camera;

main();

async function main() {
  await initScene();
  await exportGLTF();
}

async function exportGLTF() {
  const exporter = new GLTFExporter(stage);
  const serializer = await exporter.serialize(stage, {
    camera: true,
  });
  const gltf = serializer.getGLTF();
  const glb = serializer.getGLB();

  console.log(gltf);
  console.log(glb);

  const downloadElem = document.getElementById('download')!;
  const blob = new Blob([glb], { type: 'gltf' });
  const url = URL.createObjectURL(blob);
  downloadElem.setAttribute('href', url);
  downloadElem.style.display = 'block';
}

async function initScene() {
  stage = new Hilo3d.Stage({
    container: document.getElementById('game-container')!,
    width: window.innerWidth,
    height: window.innerHeight,
    clearColor: new Hilo3d.Color(0, 0, 0, 1),
  });

  camera = new Hilo3d.PerspectiveCamera({
    aspect: stage.width / stage.height,
    z: 5,
  });
  stage.camera = camera;

  const loader = new Hilo3d.Loader();
  const hiloTexture: Hilo3d.Texture = await loader.load({
    src: 'https://gw.alicdn.com/tfs/TB10RqTlvzO3e4jSZFxXXaP_FXa-600-600.png',
    type: 'Texture',
  });

  const geometry = new Hilo3d.BoxGeometry();
  (geometry as any).setAllRectUV([
    [0, 1],
    [1, 1],
    [1, 0],
    [0, 0],
  ]);
  const redBox = new Hilo3d.Mesh({
    name: 'redBox',
    geometry,
    material: new Hilo3d.PBRMaterial({
      lightType: 'NONE',
      baseColorMap: hiloTexture,
    }),
  });
  stage.addChild(redBox);

  const redBoxAnim = new Hilo3d.Animation({
    animStatesList: [
      new Hilo3d.AnimationStates({
        interpolationType: 'LINEAR',
        nodeName: 'redBox',
        keyTime: [0, 1, 2, 3, 4],
        states: [
          [1, 1, 0],
          [0.4, 0.5, 0.3],
          [-0.4, 0.5, 0.3],
          [-1, 1, 0],
          [1, 1, 0],
        ],
        type: 'Translation',
      }),
      new Hilo3d.AnimationStates({
        interpolationType: 'LINEAR',
        nodeName: 'redBox',
        keyTime: [0, 0.5, 1, 4],
        states: [
          [0.4, 0.4, 0.4],
          [0.8, 0.8, 0.8],
          [0.4, 0.4, 0.4],
          [0.4, 0.4, 0.4],
        ],
        type: 'Scale',
      }),
      new Hilo3d.AnimationStates({
        interpolationType: 'LINEAR',
        nodeName: 'redBox',
        keyTime: [0, 0.5, 1, 2, 2.5, 3, 4],
        states: [
          quat(0, 0, 90),
          quat(0, 90, 90),
          quat(90, 90, 90),
          quat(270, 90, 90),
          quat(270, 360, 90),
          quat(0, 360, 90),
          quat(0, 360, 0),
        ],
        type: 'Quaternion',
      }),
    ],
  });
  redBoxAnim.rootNode = redBox;
  redBoxAnim.play();

  const ticker = new Hilo3d.Ticker(60);
  ticker.addTick(stage);
  ticker.addTick(Hilo3d.Animation);
  ticker.start();
}
