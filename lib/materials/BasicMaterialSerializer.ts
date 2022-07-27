import * as Hilo3d from 'hilo3d';
import { GLTF } from '../gltf';
import { GLTFSerializer } from '../GLTFSerializer';

export class BasicMaterialSerializer {
  static defaultInfo = {
    baseColor: new Hilo3d.Vector4(1, 1, 1, 1),
    metallic: 1,
    roughness: 1,
    emissionFactor: new Hilo3d.Color(0, 0, 0, 0),
  };

  serialize(
    gltfSerializer: GLTFSerializer,
    material: Hilo3d.Material
  ): GLTF.IMaterial | null {
    if (!(material instanceof Hilo3d.BasicMaterial)) {
      return null;
    }

    const defaultInfo = BasicMaterialSerializer.defaultInfo;
    const res: GLTF.IMaterial = {};
    res.pbrMetallicRoughness = {};

    if (material.diffuse instanceof Hilo3d.Texture) {
      res.pbrMetallicRoughness.baseColorTexture = gltfSerializer.getTextureInfo(
        material.diffuse
      );
    } else if (material.diffuse instanceof Hilo3d.Color) {
      if (
        material.diffuse &&
        !material.diffuse.exactEquals(defaultInfo.baseColor)
      ) {
        res.pbrMetallicRoughness.baseColorFactor = material.diffuse.toArray();
      }
    }

    /**
     * Use KHR_materials_unlit extension
     * See https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_unlit/README.md
     */
    if (material.lightType === 'NONE') {
      res.extensions = {
        KHR_materials_unlit: {},
      };

      res.emissiveFactor = [0, 0, 0];
      res.pbrMetallicRoughness.metallicFactor = 0;
      res.pbrMetallicRoughness.roughnessFactor = 1;

      gltfSerializer.addExtension('KHR_materials_unlit', false);
    } else {
      if (material.normalMap) {
        res.normalTexture = gltfSerializer.getTextureInfo(material.normalMap);
      }

      if (material.emission instanceof Hilo3d.Texture) {
        res.emissiveTexture = gltfSerializer.getTextureInfo(material.emission);
      } else if (material.emission instanceof Hilo3d.Color) {
        if (
          material.emission &&
          !material.emission.exactEquals(defaultInfo.emissionFactor)
        ) {
          res.emissiveFactor = material.emission.toArray().slice(0, 3);
        }
      }

      res.pbrMetallicRoughness.metallicFactor = 0.5;
      res.pbrMetallicRoughness.roughnessFactor = 0.5;
    }

    return res;
  }
}
