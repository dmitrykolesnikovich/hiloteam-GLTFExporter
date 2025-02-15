import * as Hilo3d from 'hilo3d';

declare const AnimationStateType: {
    [type: string]: {
        path: GLTF.AnimationChannelTargetPath;
        size: number;
    };
};

declare namespace Defines {
    export {
        IExporterConfig,
        IMaterialSerializer,
        GeometryAttr2GLTF,
        AnimationStateType
    }
}
export { Defines }

declare const GeometryAttr2GLTF: {
    vertices: string;
    _normals: string;
    _tangents: string;
    uvs: string;
    uvs1: string;
    colors: string;
    skinIndices: string;
    skinWeights: string;
};

/**
 * Module for glTF 2.0 Interface
 */
declare module GLTF {
    /** Data type of the values composing each element in the accessor. */
    type AccessorComponentType = number;
    /** Element type contained by the accessor (SCALAR, VEC2, ...). */
    type AccessorType = 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4' | 'MAT2' | 'MAT3' | 'MAT4';
    /** Name of the property to be modified by an animation channel. */
    type AnimationChannelTargetPath = 'translation' | 'rotation' | 'scale' | 'weights';
    /** Interpolation method. */
    type AnimationSamplerInterpolation = 'LINEAR' | 'STEP' | 'CUBICSPLINE';
    /** Projection type used by a camera. */
    type CameraType = 'perspective' | 'orthographic';
    /** The alpha rendering mode of the material. */
    type MaterialAlphaMode = 'OPAQUE' | 'MASK' | 'BLEND';
    /** The type of the GL primitives to render. */
    type MeshPrimitiveMode = number;
    /** Magnification filter.  Values match to WebGL enums: 9728 (NEAREST) and 9729 (LINEAR). */
    type TextureMagFilter = number;
    /** Minification filter.  All valid values correspond to WebGL enums. */
    type TextureMinFilter = number;
    /** S (U) wrapping mode.  All valid values correspond to WebGL enums. */
    type TextureWrapMode = number;
    /**
     * glTF Property
     */
    interface IProperty {
        /**
         * Dictionary object with extension-specific objects
         */
        extensions?: Record<string, unknown>;
        /**
         * Application-Specific data
         */
        extras?: Record<string, unknown>;
    }
    /**
     * glTF Child of Root Property
     */
    interface IChildRootProperty extends IProperty {
        /**
         * The user-defined name of this object
         */
        name?: string;
    }
    /**
     * Indices of those attributes that deviate from their initialization value
     */
    interface IAccessorSparseIndices extends IProperty {
        /**
         * The index of the bufferView with sparse indices. Referenced bufferView can't have
         * ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER target
         */
        bufferView: number;
        /**
         * The offset relative to the start of the bufferView in bytes. Must be aligned
         */
        byteOffset?: number;
        /**
         * The indices data type.  Valid values correspond to WebGL enums: 5121 (UNSIGNED_BYTE),
         * 5123 (UNSIGNED_SHORT), 5125 (UNSIGNED_INT)
         */
        componentType: AccessorComponentType;
    }
    /**
     * Array of size accessor.sparse.count times number of components storing the displaced accessor
     * attributes pointed by accessor.sparse.indices
     */
    interface IAccessorSparseValues extends IProperty {
        /**
         * The index of the bufferView with sparse values. Referenced bufferView can't have
         * ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER target
         */
        bufferView: number;
        /**
         * The offset relative to the start of the bufferView in bytes. Must be aligned
         */
        byteOffset?: number;
    }
    /**
     * Sparse storage of attributes that deviate from their initialization value
     */
    interface IAccessorSparse extends IProperty {
        /**
         * The number of attributes encoded in this sparse accessor
         */
        count: number;
        /**
         * Index array of size count that points to those accessor attributes that deviate from
         * their initialization value. Indices must strictly increase
         */
        indices: IAccessorSparseIndices;
        /**
         * Array of size count times number of components, storing the displaced accessor attributes
         * pointed by indices. Substituted values must have the same componentType and number of
         * components as the base accessor
         */
        values: IAccessorSparseValues;
    }
    /**
     * A typed view into a bufferView.  A bufferView contains raw binary data.  An accessor provides
     * a typed view into a bufferView or a subset of a bufferView similar to how WebGL's
     * vertexAttribPointer() defines an attribute in a buffer
     */
    interface IAccessor extends IChildRootProperty {
        /**
         * The index of the bufferview
         */
        bufferView?: number;
        /**
         * The offset relative to the start of the bufferView in bytes
         */
        byteOffset?: number;
        /**
         * The datatype of components in the attribute
         */
        componentType: AccessorComponentType;
        /**
         * Specifies whether integer data values should be normalized
         */
        normalized?: boolean;
        /**
         * The number of attributes referenced by this accessor
         */
        count: number;
        /**
         * Specifies if the attribute is a scalar, vector, or matrix
         */
        type: AccessorType;
        /**
         * Maximum value of each component in this attribute
         */
        max?: number[];
        /**
         * Minimum value of each component in this attribute
         */
        min?: number[];
        /**
         * Sparse storage of attributes that deviate from their initialization value
         */
        sparse?: IAccessorSparse;
    }
    /**
     * Targets an animation's sampler at a node's property
     */
    interface IAnimationChannel extends IProperty {
        /**
         * The index of a sampler in this animation used to compute the value for the target
         */
        sampler: number;
        /**
         * The index of the node and TRS property to target
         */
        target: IAnimationChannelTarget;
    }
    /**
     * The index of the node and TRS property that an animation channel targets
     */
    interface IAnimationChannelTarget extends IProperty {
        /**
         * The index of the node to target
         */
        node?: number;
        /**
         * The name of the node's TRS property to modify, or the weights of the Morph Targets it
         * instantiates
         */
        path: AnimationChannelTargetPath;
    }
    /**
     * Combines input and output accessors with an interpolation algorithm to define a keyframe
     * graph (but not its target)
     */
    interface IAnimationSampler extends IProperty {
        /**
         * The index of an accessor containing keyframe input values, e.g., time
         */
        input: number;
        /**
         * Interpolation algorithm
         */
        interpolation?: AnimationSamplerInterpolation;
        /**
         * The index of an accessor, containing keyframe output values
         */
        output: number;
    }
    /**
     * A keyframe animation
     */
    interface IAnimation extends IChildRootProperty {
        /**
         * An array of channels, each of which targets an animation's sampler at a node's property
         */
        channels: IAnimationChannel[];
        /**
         * An array of samplers that combines input and output accessors with an interpolation
         * algorithm to define a keyframe graph (but not its target)
         */
        samplers: IAnimationSampler[];
    }
    /**
     * Metadata about the glTF asset
     */
    interface IAsset extends IChildRootProperty {
        /**
         * A copyright message suitable for display to credit the content creator
         */
        copyright?: string;
        /**
         * Tool that generated this glTF model.  Useful for debugging
         */
        generator?: string;
        /**
         * The glTF version that this asset targets
         */
        version: string;
        /**
         * The minimum glTF version that this asset targets
         */
        minVersion?: string;
    }
    /**
     * A buffer points to binary geometry, animation, or skins
     */
    interface IBuffer extends IChildRootProperty {
        /**
         * The uri of the buffer.  Relative paths are relative to the .gltf file.  Instead of
         * referencing an external file, the uri can also be a data-uri
         */
        uri?: string;
        /**
         * The length of the buffer in bytes
         */
        byteLength: number;
    }
    /**
     * A view into a buffer generally representing a subset of the buffer
     */
    interface IBufferView extends IChildRootProperty {
        /**
         * The index of the buffer
         */
        buffer: number;
        /**
         * The offset into the buffer in bytes
         */
        byteOffset?: number;
        /**
         * The lenth of the bufferView in bytes
         */
        byteLength: number;
        /**
         * The stride, in bytes
         */
        byteStride?: number;
        /**
         * The target that the GPU buffer should be bound to
         */
        target?: number;
    }
    /**
     * An orthographic camera containing properties to create an orthographic projection matrix
     */
    interface ICameraOrthographic extends IProperty {
        /**
         * The floating-point horizontal magnification of the view. Must not be zero
         */
        xmag: number;
        /**
         * The floating-point vertical magnification of the view. Must not be zero
         */
        ymag: number;
        /**
         * The floating-point distance to the far clipping plane. zfar must be greater than znear
         */
        zfar: number;
        /**
         * The floating-point distance to the near clipping plane
         */
        znear: number;
    }
    /**
     * A perspective camera containing properties to create a perspective projection matrix
     */
    interface ICameraPerspective extends IProperty {
        /**
         * The floating-point aspect ratio of the field of view
         */
        aspectRatio?: number;
        /**
         * The floating-point vertical field of view in radians
         */
        yfov: number;
        /**
         * The floating-point distance to the far clipping plane
         */
        zfar?: number;
        /**
         * The floating-point distance to the near clipping plane
         */
        znear: number;
    }
    /**
     * A camera's projection.  A node can reference a camera to apply a transform to place the
     * camera in the scene
     */
    interface ICamera extends IChildRootProperty {
        /**
         * An orthographic camera containing properties to create an orthographic projection matrix
         */
        orthographic?: ICameraOrthographic;
        /**
         * A perspective camera containing properties to create a perspective projection matrix
         */
        perspective?: ICameraPerspective;
        /**
         * Specifies if the camera uses a perspective or orthographic projection
         */
        type: CameraType;
    }
    /**
     * Image data used to create a texture. Image can be referenced by URI or bufferView index.
     * mimeType is required in the latter case
     */
    interface IImage extends IChildRootProperty {
        /**
         * The uri of the image.  Relative paths are relative to the .gltf file.  Instead of
         * referencing an external file, the uri can also be a data-uri.  The image format must be
         * jpg or png
         */
        uri?: string;
        /**
         * The image's MIME type
         */
        mimeType?: string;
        /**
         * The index of the bufferView that contains the image. Use this instead of the image's uri
         * property
         */
        bufferView?: number;
    }
    /**
     * Material Normal Texture Info
     */
    interface IMaterialNormalTextureInfo extends ITextureInfo {
        /**
         * The scalar multiplier applied to each normal vector of the normal texture
         */
        scale?: number;
    }
    /**
     * Material Occlusion Texture Info
     */
    interface IMaterialOcclusionTextureInfo extends ITextureInfo {
        /**
         * A scalar multiplier controlling the amount of occlusion applied
         */
        strength?: number;
    }
    /**
     * A set of parameter values that are used to define the metallic-roughness material model from
     * Physically-Based Rendering (PBR) methodology
     */
    interface IMaterialPbrMetallicRoughness {
        /**
         * The material's base color factor
         */
        baseColorFactor?: number[];
        /**
         * The base color texture
         */
        baseColorTexture?: ITextureInfo;
        /**
         * The metalness of the material
         */
        metallicFactor?: number;
        /**
         * The roughness of the material
         */
        roughnessFactor?: number;
        /**
         * The metallic-roughness texture
         */
        metallicRoughnessTexture?: ITextureInfo;
    }
    /**
     * The material appearance of a primitive
     */
    interface IMaterial extends IChildRootProperty {
        /**
         * A set of parameter values that are used to define the metallic-roughness material model
         * from Physically-Based Rendering (PBR) methodology. When not specified, all the default
         * values of pbrMetallicRoughness apply
         */
        pbrMetallicRoughness?: IMaterialPbrMetallicRoughness;
        /**
         * The normal map texture
         */
        normalTexture?: IMaterialNormalTextureInfo;
        /**
         * The occlusion map texture
         */
        occlusionTexture?: IMaterialOcclusionTextureInfo;
        /**
         * The emissive map texture
         */
        emissiveTexture?: ITextureInfo;
        /**
         * The RGB components of the emissive color of the material. These values are linear. If
         * an emissiveTexture is specified, this value is multiplied with the texel values
         */
        emissiveFactor?: number[];
        /**
         * The alpha rendering mode of the material
         */
        alphaMode?: MaterialAlphaMode;
        /**
         * The alpha cutoff value of the material
         */
        alphaCutoff?: number;
        /**
         * Specifies whether the material is double sided
         */
        doubleSided?: boolean;
    }
    /**
     * Geometry to be rendered with the given material
     */
    interface IMeshPrimitive extends IProperty {
        /**
         * A dictionary object, where each key corresponds to mesh attribute semantic and each
         * value is the index of the accessor containing attribute's data
         */
        attributes: {
            [name: string]: number;
        };
        /**
         * The index of the accessor that contains the indices
         */
        indices?: number;
        /**
         * The index of the material to apply to this primitive when rendering
         */
        material?: number;
        /**
         * The type of primitives to render. All valid values correspond to WebGL enums
         */
        mode?: MeshPrimitiveMode;
        /**
         * An array of Morph Targets, each  Morph Target is a dictionary mapping attributes (only
         * POSITION, NORMAL, and TANGENT supported) to their deviations in the Morph Target
         */
        targets?: {
            [name: string]: number;
        }[];
    }
    /**
     * A set of primitives to be rendered.  A node can contain one mesh.  A node's transform
     * places the mesh in the scene
     */
    interface IMesh extends IChildRootProperty {
        /**
         * An array of primitives, each defining geometry to be rendered with a material
         */
        primitives: IMeshPrimitive[];
        /**
         * Array of weights to be applied to the Morph Targets
         */
        weights?: number[];
    }
    /**
     * A node in the node hierarchy
     */
    interface INode extends IChildRootProperty {
        /**
         * The index of the camera referenced by this node
         */
        camera?: number;
        /**
         * The indices of this node's children
         */
        children?: number[];
        /**
         * The index of the skin referenced by this node
         */
        skin?: number;
        /**
         * A floating-point 4x4 transformation matrix stored in column-major order
         */
        matrix?: number[];
        /**
         * The index of the mesh in this node
         */
        mesh?: number;
        /**
         * The node's unit quaternion rotation in the order (x, y, z, w), where w is the scalar
         */
        rotation?: number[];
        /**
         * The node's non-uniform scale, given as the scaling factors along the x, y, and z axes
         */
        scale?: number[];
        /**
         * The node's translation along the x, y, and z axes
         */
        translation?: number[];
        /**
         * The weights of the instantiated Morph Target. Number of elements must match number of
         * Morph Targets of used mesh
         */
        weights?: number[];
    }
    /**
     * Texture sampler properties for filtering and wrapping modes
     */
    interface ISampler extends IChildRootProperty {
        /**
         * Magnification filter.  Valid values correspond to WebGL enums: 9728 (NEAREST) and 9729
         * (LINEAR)
         */
        magFilter?: TextureMagFilter;
        /**
         * Minification filter.  All valid values correspond to WebGL enums
         */
        minFilter?: TextureMinFilter;
        /**
         * S (U) wrapping mode.  All valid values correspond to WebGL enums
         */
        wrapS?: TextureWrapMode;
        /**
         * T (V) wrapping mode.  All valid values correspond to WebGL enums
         */
        wrapT?: TextureWrapMode;
    }
    /**
     * The root nodes of a scene
     */
    interface IScene extends IChildRootProperty {
        /**
         * The indices of each root node
         */
        nodes: number[];
    }
    /**
     * Joints and matrices defining a skin
     */
    interface ISkin extends IChildRootProperty {
        /**
         * The index of the accessor containing the floating-point 4x4 inverse-bind matrices. The
         * default is that each matrix is a 4x4 identity matrix, which implies that inverse-bind
         * matrices were pre-applied
         */
        inverseBindMatrices?: number;
        /**
         * The index of the node used as a skeleton root. When undefined, joints transforms resolve
         * to scene root
         */
        skeleton?: number;
        /**
         * Indices of skeleton nodes, used as joints in this skin.  The array length must be the
         * same as the count property of the inverseBindMatrices accessor (when defined)
         */
        joints: number[];
    }
    /**
     * A texture and its sampler
     */
    interface ITexture extends IChildRootProperty {
        /**
         * The index of the sampler used by this texture. When undefined, a sampler with repeat
         * wrapping and auto filtering should be used
         */
        sampler?: number;
        /**
         * The index of the image used by this texture
         */
        source?: number;
    }
    /**
     * Reference to a texture
     */
    interface ITextureInfo extends IProperty {
        /**
         * The index of the texture
         */
        index: number;
        /**
         * The set index of texture's TEXCOORD attribute used for texture coordinate mapping
         */
        texCoord?: number;
    }
    /**
     * The root object for a glTF asset
     */
    interface IGLTF extends IProperty {
        /**
         * An array of accessors. An accessor is a typed view into a bufferView
         */
        accessors?: IAccessor[];
        /**
         * An array of keyframe animations
         */
        animations?: IAnimation[];
        /**
         * Metadata about the glTF asset
         */
        asset: IAsset;
        /**
         * An array of buffers.  A buffer points to binary geometry, animation, or skins
         */
        buffers?: IBuffer[];
        /**
         * An array of bufferViews.  A bufferView is a view into a buffer generally representing
         * a subset of the buffer
         */
        bufferViews?: IBufferView[];
        /**
         * An array of cameras
         */
        cameras?: ICamera[];
        /**
         * Names of glTF extensions used somewhere in this asset
         */
        extensionsUsed?: string[];
        /**
         * Names of glTF extensions required to properly load this asset
         */
        extensionsRequired?: string[];
        /**
         * An array of images.  An image defines data used to create a texture
         */
        images?: IImage[];
        /**
         * An array of materials.  A material defines the appearance of a primitive
         */
        materials?: IMaterial[];
        /**
         * An array of meshes.  A mesh is a set of primitives to be rendered
         */
        meshes?: IMesh[];
        /**
         * An array of nodes
         */
        nodes?: INode[];
        /**
         * An array of samplers.  A sampler contains properties for texture filtering and wrapping
         * modes
         */
        samplers?: ISampler[];
        /**
         * The index of the default scene
         */
        scene?: number;
        /**
         * An array of scenes
         */
        scenes?: IScene[];
        /**
         * An array of skins.  A skin is defined by joints and matrices
         */
        skins?: ISkin[];
        /**
         * An array of textures
         */
        textures?: ITexture[];
    }
}

/**
 * GLTFExporter
 */
export declare class GLTFExporter {
    private _materialSerializers;
    private _stage;
    constructor(stage: Hilo3d.Stage);
    /**
     * 增加材质序列器
     * @param materialSerializer
     */
    addMaterialSerializer(materialSerializer: IMaterialSerializer): void;
    /**
     * 序列化场景
     * @param scene 导出的场景
     * @param config 导出配置
     * @returns 序列化器
     */
    serialize(scene: Hilo3d.Node, config?: IExporterConfig): Promise<GLTFSerializer>;
}

declare class GLTFSerializer {
    materialSerializers: IMaterialSerializer[];
    nodes: GLTF.INode[];
    private _nodeMap;
    meshes: GLTF.IMesh[];
    cameras: GLTF.ICamera[];
    scenes: GLTF.IScene[];
    animations: GLTF.IAnimation[];
    buffers: GLTF.IBuffer[];
    bufferDatas: Hilo3d.GeometryData[];
    bufferViews: GLTF.IBufferView[];
    private _bufferViewMap;
    accessors: GLTF.IAccessor[];
    private _accessorMap;
    materials: GLTF.IMaterial[];
    private _materialMap;
    textures: GLTF.ITexture[];
    private _textureMap;
    images: GLTF.IImage[];
    private _imageMap;
    samplers: GLTF.ISampler[];
    skins: GLTF.ISkin[];
    private _skinMap;
    extensionsRequired: string[];
    extensionsUsed: string[];
    extensions: {
        [key: string]: any;
    };
    extras: any;
    config: IExporterConfig;
    private _stage;
    constructor(stage: Hilo3d.Stage, materialSerializers: IMaterialSerializer[], config?: IExporterConfig);
    /**
     * 序列化场景
     * @param scene 序列化的场景
     * @param animations 序列化的动画
     */
    serialize(scene: Hilo3d.Node, animations?: Hilo3d.Animation[]): Promise<void>;
    /**
     * 获取 glb 数据
     * @returns {ArrayBuffer} glb 数据
     */
    getGLB(): ArrayBuffer;
    getTextureInfo(texture: Hilo3d.Texture): GLTF.ITextureInfo;
    /**
     * 获取 glTF 数据
     * @returns {GLTF.IGLTF} gltf 数据
     */
    getGLTF(): GLTF.IGLTF;
    /**
     * 增加扩展
     * @param name 扩展名称
     * @param isRequired 是否必须的扩展
     */
    addExtension(name: string, isRequired?: boolean): any;
    getExtension(name: string, isRequired?: boolean): any;
    private _mergeAnimations;
    private _mergeBufferDatas;
    private _parseScene;
    private _parseNode;
    private _parseSkin;
    private _parseAnimation;
    private _parseMesh;
    private _parseCamera;
    private _rebuildGeometry;
    private _parsePrimitives;
    parseGeometryData(geometryData: Hilo3d.GeometryData): number;
    private _parseBuffer;
    private _parseBufferView;
    private _parseAccessor;
    private _parseMaterial;
    private _parseGLTFMaterial;
    private _parseTexture;
    private _parseSampler;
    private _parseImage;
    private _getNodeTransform;
    private _convertBuffer2Base64;
    private _getGeometryDataMinMax;
    private _getImageSrc;
    private _framebuffer;
    get framebuffer(): Hilo3d.Framebuffer;
    private _screenMesh;
    get screenMesh(): Hilo3d.Mesh;
    private _getImageBase64Src;
}

declare interface IExporterConfig {
    /**
     * 是否导出stage的相机
     * @default false
     */
    camera?: boolean;
    /**
     * 需要导出的动画
     * @default Hilo3d.Animation['_anims']
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

declare interface IMaterialSerializer {
    serialize: (gltfSerializer: GLTFSerializer, material: Hilo3d.Material, mesh?: Hilo3d.Mesh) => GLTF.IMaterial | null;
}

export declare class RenderUtil {
    private static _canvas;
    static get canvas(): HTMLCanvasElement;
    private static _canvasCtx2d;
    static get canvasCtx2d(): CanvasRenderingContext2D;
    static renderMeshToFramebuffer(stage: Hilo3d.Stage, sprite: Hilo3d.Mesh, camera: Hilo3d.Camera, framebuffer: Hilo3d.Framebuffer, clearColor?: Hilo3d.Color): void;
    static framebufferToBase64(framebuffer: Hilo3d.Framebuffer, imageType?: string, quality?: number): string;
    static renderNodeToFramebuffer(stage: Hilo3d.Stage, node: Hilo3d.Node, camera: Hilo3d.Camera, framebuffer: Hilo3d.Framebuffer, clearColor?: Hilo3d.Color, needUpdate?: boolean): void;
}

export declare const version = "EXPORTER_VERSION";

export { }
