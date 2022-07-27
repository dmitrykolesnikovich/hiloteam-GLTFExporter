import * as Hilo3d from 'hilo3d';
import { GLTF } from './gltf';
import { GLTFSerializer } from './GLTFSerializer';

export interface IExporterConfig {
  /**
   * 相机
   */
  camera?: boolean;
  /**
   * 需要导出的动画
   * @default null
   */
  anims?: Hilo3d.Animation[];
  /**
   * 是否合并动画
   * @default true
   */
  mergeAnimations?: boolean;
  /**
   * 是否忽略不认识的材质报错
   * @default true
   */
  ignoreUnknownMaterialError?: boolean;
  /**
   * 解析完成回调
   */
  onParseEnd?: (serializer: GLTFSerializer) => void;
}

export interface IMaterialSerializer {
  serialize: (
    gltfSerializer: GLTFSerializer,
    material: Hilo3d.Material,
    mesh?: Hilo3d.Mesh
  ) => GLTF.IMaterial | null;
}

export const GeometryAttr2GLTF = {
  vertices: 'POSITION',
  _normals: 'NORMAL',
  _tangents: 'TANGENT',
  uvs: 'TEXCOORD_0',
  uvs1: 'TEXCOORD_1',
  colors: 'COLOR_0',
  skinIndices: 'JOINTS_0',
  skinWeights: 'WEIGHTS_0',
};

export const AnimationStateType: {
  [type: string]: {
    path: GLTF.AnimationChannelTargetPath;
    size: number;
  };
} = {
  Translation: {
    path: 'translation',
    size: 3,
  },
  Scale: {
    path: 'scale',
    size: 3,
  },
  Rotation: {
    path: 'rotation',
    size: 4,
  },
  Quaternion: {
    path: 'rotation',
    size: 4,
  },
  Weights: {
    path: 'weights',
    size: 1,
  },
};
