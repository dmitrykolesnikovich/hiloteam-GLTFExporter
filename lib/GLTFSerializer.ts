import * as Hilo3d from 'hilo3d';
import { GLTF } from './gltf';
import { version } from './version';
import {
  AnimationStateType,
  GeometryAttr2GLTF,
  IExporterConfig as IExporterConfig,
  IMaterialSerializer,
} from './defines';
import { dataPad4, lengthPad4 } from './utils';

import { RenderUtil } from './RenderUtil';

export class GLTFSerializer {
  materialSerializers: IMaterialSerializer[];
  public nodes: GLTF.INode[];
  private _nodeMap: Map<Hilo3d.Node, number>;
  public meshes: GLTF.IMesh[];
  public cameras: GLTF.ICamera[];
  public scenes: GLTF.IScene[];
  public animations: GLTF.IAnimation[];

  public buffers: GLTF.IBuffer[];
  public bufferDatas: Hilo3d.GeometryData[];

  public bufferViews: GLTF.IBufferView[];
  private _bufferViewMap: Map<string, number>;

  public accessors: GLTF.IAccessor[];
  private _accessorMap: Map<Hilo3d.GeometryData, number>;

  public materials: GLTF.IMaterial[];
  private _materialMap: Map<Hilo3d.Material, number>;

  public textures: GLTF.ITexture[];
  private _textureMap: Map<Hilo3d.Texture, number>;

  public images: GLTF.IImage[];
  private _imageMap: Map<string, number>;

  public samplers: GLTF.ISampler[];

  public skins: GLTF.ISkin[];
  private _skinMap: Map<Hilo3d.Skeleton, number>;

  public extensionsRequired: string[];
  public extensionsUsed: string[];
  public extensions: { [key: string]: any };
  public extras: any;

  public config: IExporterConfig;
  private _stage: Hilo3d.Stage;

  public constructor(
    stage: Hilo3d.Stage,
    materialSerializers: IMaterialSerializer[],
    config: IExporterConfig = {}
  ) {
    this._stage = stage;
    this.config = Object.assign(
      {
        camera: false,
        mergeAnimations: true,
        ignoreUnknownMaterialError: true,
      },
      config
    );
    this.materialSerializers = materialSerializers;
    this.nodes = [];
    this._nodeMap = new Map();
    this.meshes = [];
    this.cameras = [];
    this.scenes = [];
    this.animations = [];

    this.buffers = [];
    this.bufferDatas = [];

    this.bufferViews = [];
    this._bufferViewMap = new Map();

    this.accessors = [];
    this._accessorMap = new Map();

    this.materials = [];
    this._materialMap = new Map();

    this.textures = [];
    this._textureMap = new Map();

    this.images = [];
    this._imageMap = new Map();

    this.samplers = [];

    this.skins = [];
    this._skinMap = new Map();

    this.extensions = {};
    this.extensionsRequired = [];
    this.extensionsUsed = [];
  }

  /**
   * 序列化场景
   * @param scene 序列化的场景
   * @param animations 序列化的动画
   */
  public async serialize(scene: Hilo3d.Node, animations?: Hilo3d.Animation[]) {
    this._parseScene(scene);

    if (animations) {
      this.animations.push(...this._parseAnimation(animations));
    }

    this.config.onParseEnd?.(this);
    this._mergeAnimations();
    this._mergeBufferDatas();

    this.buffers = await Promise.all(
      this.bufferDatas.map(async (geometryData) => {
        return {
          uri: await this._convertBuffer2Base64(geometryData.data),
          byteLength: geometryData.data.byteLength,
        };
      })
    );
  }

  /**
   * 获取 glb 数据
   * @returns {ArrayBuffer} glb 数据
   */
  public getGLB(): ArrayBuffer {
    const glTFResult = this.getGLTF();
    const buffer = glTFResult.buffers?.[0];
    if (buffer) {
      glTFResult.buffers = [
        {
          byteLength: buffer.byteLength,
        },
      ];
    }

    let totalByteLength = 0;
    const header = new Uint32Array(3);
    header[0] = 0x46546c67;
    header[1] = 2;
    totalByteLength += 12;

    const textEncoder = new TextEncoder();
    const originJsonContent = textEncoder.encode(JSON.stringify(glTFResult));
    const jsonContent = dataPad4(originJsonContent, 0x20);
    const jsonType = 0x4e4f534a;
    const jsonByteLength = jsonContent.byteLength;
    totalByteLength += 8 + jsonByteLength;

    const binType = 0x004e4942;
    const binByteLength = buffer ? lengthPad4(buffer.byteLength) : 0;
    if (buffer) {
      totalByteLength += 8 + binByteLength;
    }

    header[2] = totalByteLength;

    const data = new ArrayBuffer(totalByteLength);
    const uint32View = new Uint32Array(data);
    const uint8View = new Uint8Array(data);
    let start = 0;
    uint32View.set(header, 0);
    start += 12;

    uint32View[start / 4] = jsonByteLength;
    start += 4;

    uint32View[start / 4] = jsonType;
    start += 4;

    uint8View.set(jsonContent, start);
    start += jsonByteLength;

    if (buffer) {
      uint32View[start / 4] = binByteLength;
      start += 4;

      uint32View[start / 4] = binType;
      start += 4;

      uint8View.set(this.bufferDatas[0].data, start);
      start += binByteLength;
    }

    return data;
  }

  public getTextureInfo(texture: Hilo3d.Texture): GLTF.ITextureInfo {
    const textureInfo: GLTF.ITextureInfo = {
      index: this._parseTexture(texture),
    };

    if (texture.uv !== 0) {
      textureInfo.texCoord = texture.uv;
    }

    return textureInfo;
  }

  /**
   * 获取 glTF 数据
   * @returns {GLTF.IGLTF} gltf 数据
   */
  public getGLTF(): GLTF.IGLTF {
    const glTFResult: GLTF.IGLTF = {
      asset: {
        version: '2.0',
        generator: `Hilo3d GLTFExporter ${version}`,
        copyright: 'Copyright (c) 2017-present Alibaba Group Holding Ltd.',
      },
    };

    if (this.extras) {
      glTFResult.extras = this.extras;
    }

    if (this.scenes.length) {
      glTFResult.scenes = this.scenes;
      glTFResult.scene = 0;
    }

    if (this.nodes.length) {
      glTFResult.nodes = this.nodes;
    }

    if (this.meshes.length) {
      glTFResult.meshes = this.meshes;
    }

    if (this.materials.length) {
      glTFResult.materials = this.materials;
    }

    if (this.buffers.length) {
      glTFResult.buffers = this.buffers;
    }

    if (this.bufferViews.length) {
      glTFResult.bufferViews = this.bufferViews;
    }

    if (this.accessors.length) {
      glTFResult.accessors = this.accessors;
    }

    if (this.textures.length) {
      glTFResult.textures = this.textures;
    }

    if (this.samplers.length) {
      glTFResult.samplers = this.samplers;
    }

    if (this.images.length) {
      glTFResult.images = this.images;
    }

    if (this.animations.length > 0) {
      glTFResult.animations = this.animations;
    }

    if (this.skins.length > 0) {
      glTFResult.skins = this.skins;
    }

    if (this.cameras.length > 0) {
      glTFResult.cameras = this.cameras;
    }

    if (Object.keys(this.extensions).length > 0) {
      glTFResult.extensions = this.extensions;
    }

    if (this.extensionsUsed.length > 0) {
      glTFResult.extensionsUsed = this.extensionsUsed;
    }

    if (this.extensionsRequired.length > 0) {
      glTFResult.extensionsRequired = this.extensionsRequired;
    }

    return glTFResult;
  }

  /**
   * 增加扩展
   * @param name 扩展名称
   * @param isRequired 是否必须的扩展
   */
  public addExtension(name: string, isRequired = true) {
    if (this.extensionsUsed.indexOf(name) < 0) {
      this.extensionsUsed.push(name);
    }

    if (isRequired && this.extensionsRequired.indexOf(name) < 0) {
      this.extensionsRequired.push(name);
    }

    if (!this.extensions[name]) {
      this.extensions[name] = {};
    }

    return this.extensions[name];
  }

  public getExtension(name: string, isRequired = true) {
    if (!this.extensions[name]) {
      this.addExtension(name, isRequired);
    }
    return this.extensions[name];
  }

  private _mergeAnimations() {
    if (!this.animations?.length || !this.config.mergeAnimations) {
      return;
    }

    const glTFAnimation: GLTF.IAnimation = {
      samplers: [],
      channels: [],
      name: 'default',
    };
    this.animations.forEach((animation) => {
      const samplerIndex = glTFAnimation.samplers.length;
      animation.channels.forEach((channel) => {
        channel.sampler += samplerIndex;
        glTFAnimation.channels.push(channel);
      });
      glTFAnimation.samplers.push(...animation.samplers);
    });
    this.animations = [glTFAnimation];
  }

  private _mergeBufferDatas() {
    if (!this.bufferDatas?.length) {
      return;
    }

    const arr: { geometryData: Hilo3d.GeometryData; start: number }[] = [];
    let start = 0;
    this.bufferDatas.forEach((geometryData) => {
      const byteLength = geometryData.data.byteLength;
      arr.push({
        geometryData,
        start,
      });
      start += lengthPad4(byteLength);
    });

    const data = new Uint8Array(start);
    arr.forEach((d, index) => {
      const v = d.geometryData.data;
      data.set(new Uint8Array(v.buffer, v.byteOffset, v.byteLength), d.start);
      this.bufferViews[index].buffer = 0;
      this.bufferViews[index].byteOffset = d.start;
    });
    this.bufferDatas = [new Hilo3d.GeometryData(data, 1)];
  }

  private _parseScene(scene?: Hilo3d.Node) {
    if (scene) {
      const glTFScene: GLTF.IScene = {
        nodes: [],
      };
      this.scenes.push(glTFScene);
      glTFScene.nodes.push(this._parseNode(scene));

      if (
        this.config.camera &&
        scene instanceof Hilo3d.Stage &&
        !scene.camera.parent
      ) {
        glTFScene.nodes.push(this._parseNode(scene.camera));
      }
    }
  }

  private _parseNode(node: Hilo3d.Node): number {
    if (!node.visible) {
      return -1;
    }
    let nodeIndex = this._nodeMap.get(node);
    if (nodeIndex === undefined) {
      nodeIndex = this.nodes.length;
      this._nodeMap.set(node, nodeIndex);

      const glTFNode: GLTF.INode = {};
      this.nodes.push(glTFNode);
      if (node.name) {
        glTFNode.name = String(node.name);
      }

      Object.assign(glTFNode, this._getNodeTransform(node));

      if (node instanceof Hilo3d.Mesh) {
        glTFNode.mesh = this._parseMesh(node);
      }

      if (node instanceof Hilo3d.SkinedMesh && node.skeleton) {
        glTFNode.skin = this._parseSkin(node.skeleton);
      }

      if (this.config.camera && node instanceof Hilo3d.Camera) {
        glTFNode.camera = this._parseCamera(node);
      }

      if (node.children.length > 0) {
        glTFNode.children = node.children
          .map((child) => {
            return this._parseNode(child);
          })
          .filter((id) => id !== -1);
      }
    }

    return nodeIndex;
  }

  private _parseSkin(skeleton: Hilo3d.Skeleton): number {
    let skinIndex = this._skinMap.get(skeleton);
    if (skinIndex === undefined) {
      skinIndex = this.skins.length;
      this._skinMap.set(skeleton, skinIndex);

      const ibmData: number[] = [];
      skeleton.inverseBindMatrices.forEach((matrix) => {
        ibmData.push(...matrix.elements);
      });
      const inverseBindMatrices = this._parseAccessor(
        new Hilo3d.GeometryData(new Float32Array(ibmData), 16)
      );

      const skin: GLTF.ISkin = {
        inverseBindMatrices,
        joints: [],
      };
      this.skins.push(skin);
      skin.joints = skeleton.jointNodeList.map((node) => this._parseNode(node));
      skin.skeleton = this._parseNode(skeleton.rootNode);
    }

    return skinIndex;
  }

  private _parseAnimation(animations: Hilo3d.Animation[]): GLTF.IAnimation[] {
    return animations.map((animation) => {
      const samplers: GLTF.IAnimationSampler[] = [];
      const channels: GLTF.IAnimationChannel[] = [];
      animation.animStatesList.map((states, index) => {
        const stateInfo = AnimationStateType[states.type];
        const input: Hilo3d.GeometryData = new Hilo3d.GeometryData(
          new Float32Array(states.keyTime),
          1
        );

        const outputArr: number[] = [];
        states.states.forEach((v) => {
          if (typeof v === 'number') {
            outputArr.push(v);
          } else {
            outputArr.push(...v);
          }
        });
        const output: Hilo3d.GeometryData = new Hilo3d.GeometryData(
          new Float32Array(outputArr),
          stateInfo.size
        );

        const sampler: GLTF.IAnimationSampler = {
          interpolation:
            states.interpolationType as GLTF.AnimationSamplerInterpolation,
          input: this._parseAccessor(input),
          output: this._parseAccessor(output),
        };
        samplers.push(sampler);

        const node = animation['nodeNameMap'][states.nodeName];
        if (node) {
          const channel: GLTF.IAnimationChannel = {
            sampler: index,
            target: {
              node: this._parseNode(node),
              path: stateInfo.path,
            },
          };
          channels.push(channel);
        }
      });

      const glTFAnimation: GLTF.IAnimation = {
        channels,
        samplers,
        name: animation.id,
      };
      return glTFAnimation;
    });
  }

  private _parseMesh(mesh: Hilo3d.Mesh): number {
    const primitives = this._parsePrimitives(mesh);
    const res: GLTF.IMesh = {
      primitives,
    };
    if (
      mesh.geometry instanceof Hilo3d.MorphGeometry &&
      mesh.geometry.weights?.length
    ) {
      res.weights = mesh.geometry.weights;
    }
    this.meshes.push(res);

    return this.meshes.length - 1;
  }

  private _parseCamera(camera: Hilo3d.Camera) {
    let glTFCamera: GLTF.ICamera;
    if (camera instanceof Hilo3d.PerspectiveCamera) {
      glTFCamera = {
        type: 'perspective',
        perspective: {
          aspectRatio: camera.aspect,
          yfov: Hilo3d.math.degToRad(camera.fov),
          znear: camera.near,
          zfar: camera.far,
        },
      };
    } else if (camera instanceof Hilo3d.OrthographicCamera) {
      glTFCamera = {
        type: 'orthographic',
        orthographic: {
          znear: camera.near,
          zfar: camera.far,
          xmag: camera.right,
          ymag: camera.top,
        },
      };
    } else {
      Hilo3d.log.warn('Not support this camera type', camera);
      glTFCamera = {
        type: 'perspective',
      };
    }

    if (camera.name) {
      glTFCamera.name = String(camera.name);
    }

    this.cameras.push(glTFCamera);
    return this.cameras.length - 1;
  }

  private _rebuildGeometry(mesh: Hilo3d.Mesh): Hilo3d.Geometry {
    const { geometry, material } = mesh;
    const newGeometry =
      geometry instanceof Hilo3d.MorphGeometry
        ? new Hilo3d.Geometry({
            mode: geometry.mode,
            weights: geometry.weights,
            targets: geometry.targets,
          })
        : new Hilo3d.MorphGeometry({
            mode: geometry.mode,
          });

    // rebuild indices
    const indices: number[] = [];
    if (geometry.indices) {
      geometry.indices.traverse((index) => {
        indices.push(index as number);
      });
    } else {
      const vertexCount = geometry.vertices.count;
      for (let i = 0; i < vertexCount; i++) {
        indices.push(i);
      }
    }

    if (material.frontFace === Hilo3d.constants.CW) {
      for (let i = 0; i < indices.length; i += 3) {
        const temp = indices[i + 1];
        indices[i + 1] = indices[i + 2];
        indices[i + 2] = temp;
      }
    }

    const dict = {};
    let index = 0;
    const newIndices: { newIndex: number; oldIndex: number }[] = [];
    indices.forEach((v, i) => {
      if (dict[v] === undefined) {
        dict[v] = index;
        index++;
      }
      newIndices[i] = {
        oldIndex: v,
        newIndex: dict[v],
      };
    });

    const newVertexInfo: {
      [name: string]: {
        data: number[];
        size: number;
        offset: number;
        normalized: boolean;
      };
    } = {};

    let stride = 0;
    Object.keys(GeometryAttr2GLTF).forEach((name) => {
      const data: Hilo3d.GeometryData = geometry[name];
      if (data) {
        const size = data.size;
        const newInfo: {
          data: number[];
          size: number;
          offset: number;
          normalized: boolean;
        } = {
          data: [],
          size,
          offset: stride,
          normalized: data.normalized,
        };
        stride += data.size * data.data.BYTES_PER_ELEMENT;
        stride = lengthPad4(stride);
        newIndices.forEach(({ oldIndex, newIndex }) => {
          const d = data.get(oldIndex);
          if (typeof d === 'number') {
            newInfo.data[newIndex] = d;
          } else {
            d.toArray(newInfo.data, newIndex * size);
          }
        });
        newVertexInfo[name] = newInfo;
      }
    });

    newGeometry.indices = new Hilo3d.GeometryData(
      new Uint16Array(newIndices.map((v) => v.newIndex)),
      1
    );

    // check skin weights
    if (newVertexInfo.skinIndices && newVertexInfo.skinWeights) {
      const skeleton = (mesh as Hilo3d.SkinedMesh).skeleton;
      const maxIndex = skeleton.jointNames.length - 1;

      newGeometry.indices.traverse((index) => {
        const skinIndicesData = newVertexInfo.skinIndices.data;
        const skinWeightsData = newVertexInfo.skinWeights.data;
        for (let i = 0; i < 4; i++) {
          const offset = (index as number) * 4 + i;
          if (skinWeightsData[offset] === 0) {
            skinIndicesData[offset] = 0;
          }
          if (skinIndicesData[offset] > maxIndex) {
            skinIndicesData[offset] = 0;
            skinWeightsData[offset] = 0;
          }
        }
      });
    }

    const data = new ArrayBuffer(
      (stride * newVertexInfo.vertices.data.length) /
        newVertexInfo.vertices.size
    );
    const uint32View = new Float32Array(data);
    const uint8View = new Uint8Array(data);
    const bufferViewId = Hilo3d.math.generateUUID('bufferView');

    // merge attributes
    Object.entries(newVertexInfo).forEach(([name, info]) => {
      const dataView = name === 'skinIndices' ? uint8View : uint32View;
      for (let i = 0; i < info.data.length; i += info.size) {
        const offset =
          ((i / info.size) * stride + info.offset) / dataView.BYTES_PER_ELEMENT;
        for (let j = 0; j < info.size; j++) {
          dataView[offset + j] = info.data[i + j];
        }
      }

      newGeometry[name] = new Hilo3d.GeometryData(dataView, info.size, {
        bufferViewId,
        stride,
        offset: info.offset,
        normalized: info.normalized,
      });
    });

    return newGeometry;
  }

  private _parsePrimitives(mesh: Hilo3d.Mesh): GLTF.IMeshPrimitive[] {
    const { material } = mesh;
    const geometry = this._rebuildGeometry(mesh);
    const primitives: GLTF.IMeshPrimitive[] = [];
    const primitive: GLTF.IMeshPrimitive = {
      attributes: {},
    };

    Object.entries(GeometryAttr2GLTF)
      .filter(([name]) => geometry[name])
      .forEach(([name, glTFName]) => {
        const geometryData: Hilo3d.GeometryData = geometry[name];
        primitive.attributes[glTFName] = this.parseGeometryData(geometryData);
      });

    primitive.indices = this.parseGeometryData(geometry.indices);

    if (geometry instanceof Hilo3d.MorphGeometry) {
      if (geometry.targets) {
        const glTFTargets: { [type: string]: number }[] = [];
        Object.entries(geometry.targets).forEach(([type, geometryDatas]) => {
          (geometryDatas as Hilo3d.GeometryData[]).forEach(
            (geometryData, index) => {
              const glTFType = GeometryAttr2GLTF[type];
              glTFTargets[index] = glTFTargets[index] || {};
              glTFTargets[index][glTFType] = this._parseAccessor(geometryData);
            }
          );
        });

        primitive.targets = glTFTargets;
      }
    }

    primitive.mode = geometry.mode;

    const materialIndex = this._parseMaterial(material, mesh);
    primitive.material = materialIndex;

    primitives.push(primitive);
    return primitives;
  }

  public parseGeometryData(geometryData: Hilo3d.GeometryData): number {
    return this._parseAccessor(geometryData);
  }

  private _parseBuffer(geometryData: Hilo3d.GeometryData) {
    this.bufferDatas.push(geometryData);

    return this.bufferDatas.length - 1;
  }

  private _parseBufferView(geometryData: Hilo3d.GeometryData): number {
    let bufferViewIndex = this._bufferViewMap.get(geometryData.bufferViewId);
    if (bufferViewIndex === undefined) {
      bufferViewIndex = this.bufferViews.length;
      this._bufferViewMap.set(geometryData.bufferViewId, bufferViewIndex);

      const bufferView: GLTF.IBufferView = {
        buffer: this._parseBuffer(geometryData),
        byteLength: geometryData.data.byteLength,
      };

      if (geometryData.stride) {
        bufferView.byteStride = geometryData.stride;
      }

      this.bufferViews.push(bufferView);
    }

    return bufferViewIndex;
  }
  private _parseAccessor(geometryData: Hilo3d.GeometryData): number {
    let accessorIndex = this._accessorMap.get(geometryData);
    if (accessorIndex === undefined) {
      accessorIndex = this.accessors.length;
      this._accessorMap.set(geometryData, accessorIndex);

      const bufferView = this._parseBufferView(geometryData);
      const typeMap = {
        1: 'SCALAR',
        2: 'VEC2',
        3: 'VEC3',
        4: 'VEC4',
        9: 'MAT3',
        16: 'MAT4',
      };

      const minMax = this._getGeometryDataMinMax(geometryData);
      const accessor: GLTF.IAccessor = {
        bufferView,
        byteOffset: geometryData.offset,
        componentType: geometryData.type,
        normalized: geometryData.normalized,
        count: geometryData.count,
        type: typeMap[geometryData.size],
        min: minMax.min,
        max: minMax.max,
      };

      this.accessors.push(accessor);
    }

    return accessorIndex;
  }

  private _parseMaterial(
    material: Hilo3d.Material,
    mesh?: Hilo3d.Mesh
  ): number {
    let materialIndex = this._materialMap.get(material);
    if (materialIndex === undefined) {
      for (let i = 0; i < this.materialSerializers.length; i++) {
        const serializer = this.materialSerializers[i];
        const gltfMaterial = serializer.serialize(this, material, mesh);
        if (gltfMaterial) {
          materialIndex = this._parseGLTFMaterial(gltfMaterial, material);
        }
      }
    }

    if (materialIndex === undefined) {
      if (this.config.ignoreUnknownMaterialError) {
        console.error('No material serializer found for material', material);
        materialIndex = this._parseGLTFMaterial(
          {
            pbrMetallicRoughness: {
              baseColorFactor: [1, 0, 0, 1],
            },
            extensions: {
              KHR_materials_unlit: {},
            },
          },
          material
        );
        this.addExtension('KHR_materials_unlit');
      } else {
        throw new Error(
          `No material serializer found for material: ${material.className}`
        );
      }
    }

    return materialIndex;
  }

  private _parseGLTFMaterial(gltfMaterial: GLTF.IMaterial, material) {
    const materialIndex = this.materials.length;
    this._materialMap.set(material, materialIndex);
    this.materials.push(gltfMaterial);

    if (material.name) {
      gltfMaterial.name = material.name;
    }

    if (material.userData) {
      gltfMaterial.extras = material.userData;
    }

    switch (material.side) {
      case Hilo3d.constants.FRONT:
        gltfMaterial.doubleSided = false;
        break;
      case Hilo3d.constants.FRONT_AND_BACK:
        gltfMaterial.doubleSided = true;
        break;
      default:
        gltfMaterial.doubleSided = true;
        break;
    }

    if (material.alphaCutoff > 0) {
      gltfMaterial.alphaMode = 'MASK';
      // 0.5 is the default value.
      if (material.alphaCutoff !== 0.5) {
        gltfMaterial.alphaCutoff = material.alphaCutoff;
      }
    } else if (material.transparent) {
      gltfMaterial.alphaMode = 'BLEND';
    } else {
      gltfMaterial.alphaMode = 'OPAQUE';
    }

    return materialIndex;
  }

  private _parseTexture(texture: Hilo3d.Texture): number {
    let textureIndex = this._textureMap.get(texture);
    if (textureIndex === undefined) {
      const sampler = this._parseSampler(texture);
      const source = this._parseImage(texture);
      textureIndex = this.textures.length;
      this._textureMap.set(texture, textureIndex);
      this.textures.push({
        sampler,
        source,
      });
    }

    return textureIndex;
  }

  private _parseSampler(texture: Hilo3d.Texture): number {
    const sampler: GLTF.ISampler = {};
    sampler.minFilter = texture.minFilter;
    sampler.magFilter = texture.magFilter;
    sampler.wrapS = texture.wrapS;
    sampler.wrapT = texture.wrapT;

    this.samplers.push(sampler);
    return this.samplers.length - 1;
  }

  private _parseImage(texture: Hilo3d.Texture): number {
    const src = this._getImageSrc(texture);
    let imageIndex = this._imageMap.get(src);
    if (imageIndex === undefined) {
      imageIndex = this.images.length;
      this._imageMap.set(src, imageIndex);
      this.images.push({
        uri: src,
      });
    }

    return imageIndex;
  }

  private _getNodeTransform(node: Hilo3d.Node): GLTF.INode {
    const transform: GLTF.INode = {};
    if (!node.position.exactEquals(new Hilo3d.Vector3(0, 0, 0))) {
      transform.translation = node.position.toArray();
    }

    if (!node.scale.exactEquals(new Hilo3d.Vector3(1, 1, 1))) {
      transform.scale = node.scale.toArray();
    }

    if (!node.quaternion.exactEquals(new Hilo3d.Quaternion(0, 0, 0, 1))) {
      transform.rotation = node.quaternion.toArray();
    }

    return transform;
  }

  private _convertBuffer2Base64(buffer: ArrayBuffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      const blob = new Blob([buffer], {
        type: 'application/octet-stream',
      });
      fileReader.readAsDataURL(blob);
      fileReader.onload = () => {
        const uri = fileReader.result as string;
        resolve(uri);
      };
      fileReader.onerror = reject;
    });
  }

  private _getGeometryDataMinMax(geometryData: Hilo3d.GeometryData) {
    const min: number[] = [];
    const max: number[] = [];
    geometryData.traverse((data) => {
      let v: number[];
      if (typeof data === 'number') {
        v = [data];
      } else {
        v = data.toArray();
      }

      v.forEach((v, i) => {
        if (min[i] === undefined) {
          min[i] = v;
        } else {
          min[i] = Math.min(v, min[i]);
        }

        if (max[i] === undefined) {
          max[i] = v;
        } else {
          max[i] = Math.max(v, max[i]);
        }
      });
    });

    return {
      min,
      max,
    };
  }

  private _getImageSrc(texture: Hilo3d.Texture) {
    if (texture instanceof Hilo3d.LazyTexture) {
      return texture.src;
    }
    if (texture['_originImage']) {
      return texture['_originImage'].src;
    }

    if (!texture.image?.src) {
      return this._getImageBase64Src(texture);
    }

    return texture.image.src;
  }

  private _framebuffer: Hilo3d.Framebuffer;
  public get framebuffer() {
    if (!this._framebuffer) {
      this._framebuffer = new Hilo3d.Framebuffer(this._stage.renderer);
      this._framebuffer.init();
    }

    return this._framebuffer;
  }

  private _screenMesh: Hilo3d.Mesh;
  public get screenMesh(): Hilo3d.Mesh {
    if (!this._screenMesh) {
      this._screenMesh = new Hilo3d.Mesh({
        geometry: new Hilo3d.PlaneGeometry({
          width: 2,
          height: 2,
        }),
        material: new Hilo3d.ShaderMaterial({
          shaderCacheId: 'glTFExportScreenShader',
          diffuse: null,
          uniforms: {
            u_diffuse: {
              get(mesh, material, programInfo) {
                return Hilo3d.semantic.handlerTexture(
                  material.diffuse,
                  programInfo.textureIndex
                );
              },
            },
          },
          vs: Hilo3d.Shader.shaders['screen.vert'],
          fs: Hilo3d.Shader.shaders['screen.frag'],
        }),
      });

      this._screenMesh.geometry.uvs.traverse((v, index, offset) => {
        this._screenMesh.geometry.uvs.data[offset + 1] =
          1 - (v as Hilo3d.Vector2).y;
      });
    }

    return this._screenMesh;
  }
  private _getImageBase64Src(texture: Hilo3d.Texture) {
    this.screenMesh.material['diffuse'] = texture;
    this.framebuffer.resize(texture.width || 512, texture.height || 512);
    RenderUtil.renderMeshToFramebuffer(
      this._stage,
      this.screenMesh,
      this._stage.camera,
      this.framebuffer
    );
    const src = RenderUtil.framebufferToBase64(this.framebuffer);
    return src;
  }
}
