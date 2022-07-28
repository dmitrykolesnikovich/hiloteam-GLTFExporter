import * as Hilo3d from 'hilo3d';

import { IExporterConfig, IMaterialSerializer } from './defines';
import { GLTFSerializer } from './GLTFSerializer';
import { PBRMaterialSerializer } from './materials/PBRMaterialSerializer';
import { BasicMaterialSerializer } from './materials/BasicMaterialSerializer';

/**
 * GLTFExporter
 */
export class GLTFExporter {
  private _materialSerializers: IMaterialSerializer[];
  private _stage: Hilo3d.Stage;

  public constructor(stage: Hilo3d.Stage) {
    this._stage = stage;

    this._materialSerializers = [];
    this.addMaterialSerializer(new PBRMaterialSerializer());
    this.addMaterialSerializer(new BasicMaterialSerializer());
  }

  /**
   * 增加材质序列器
   * @param materialSerializer
   */
  public addMaterialSerializer(materialSerializer: IMaterialSerializer) {
    this._materialSerializers.push(materialSerializer);
  }

  /**
   * 序列化场景
   * @param scene 导出的场景
   * @param config 导出配置
   * @returns 序列化器
   */
  public async serialize(scene: Hilo3d.Node, config: IExporterConfig = {}) {
    const serializer: GLTFSerializer = new GLTFSerializer(
      this._stage,
      this._materialSerializers,
      config
    );
    await serializer.serialize(
      scene,
      config.anims || Hilo3d.Animation['_anims']
    );
    return serializer;
  }
}
