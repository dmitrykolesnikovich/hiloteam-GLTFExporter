import * as Hilo3d from 'hilo3d';
import { GLTF } from '../gltf';
import { GLTFSerializer } from '../GLTFSerializer';

export class PBRMaterialSerializer {
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
    if (!(material instanceof Hilo3d.PBRMaterial)) {
      return null;
    }

    const defaultInfo = PBRMaterialSerializer.defaultInfo;
    const res: GLTF.IMaterial = {};
    res.pbrMetallicRoughness = {};

    const baseColorMap = material.baseColorMap;
    if (baseColorMap) {
      res.pbrMetallicRoughness.baseColorTexture =
        gltfSerializer.getTextureInfo(baseColorMap);
    }

    if (
      material.baseColor &&
      !material.baseColor.exactEquals(defaultInfo.baseColor)
    ) {
      res.pbrMetallicRoughness.baseColorFactor = material.baseColor.toArray();
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
      const metallicRoughnessMap = material.metallicRoughnessMap;
      if (metallicRoughnessMap) {
        res.pbrMetallicRoughness.metallicRoughnessTexture =
          gltfSerializer.getTextureInfo(metallicRoughnessMap);
      }

      if (material.metallic !== defaultInfo.metallic) {
        res.pbrMetallicRoughness.metallicFactor = material.metallic;
      }

      if (material.roughness !== defaultInfo.roughness) {
        res.pbrMetallicRoughness.roughnessFactor = material.roughness;
      }

      if (material.normalMap) {
        res.normalTexture = gltfSerializer.getTextureInfo(material.normalMap);
      }

      if (material.emission) {
        res.emissiveTexture = gltfSerializer.getTextureInfo(material.emission);
      }

      if (
        material.emissionFactor &&
        !material.emissionFactor.exactEquals(defaultInfo.emissionFactor)
      ) {
        res.emissiveFactor = material.emissionFactor.toArray().slice(0, 3);
      }

      if (material.occlusionMap) {
        res.occlusionTexture = gltfSerializer.getTextureInfo(
          material.occlusionMap
        );
      }
    }

    return res;
  }
}
