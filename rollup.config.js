const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const replace = require('rollup-plugin-replace');
const json = require('rollup-plugin-json');
const typescript = require('rollup-plugin-typescript2');
const pkg = require('./package.json');


function pluginsBase() {
  return [
    json({
      preferConst: true,
    }),
    resolve({
      mainFields: ['jsnext', 'esnext', 'module', 'main'],
    }),
    typescript({
      tsconfig: 'tsconfig.json',
      tsconfigOverride: {
        compilerOptions: {
          declarationMap: false,
          declaration: false,
          target: 'es5',
          downlevelIteration: true,
        },
      },
    }),
    commonjs({
      include: ['node_modules/**', 'dist/es/**', 'packages/**/node_modules/**'],
    }),
    replace({
      ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
      EXPORTER_VERSION: pkg.version,
    }),
  ];
}

function distConfig(input, file, format, pkg, tsConfig = {}) {
  return {
    input,
    external: format !== 'iife' ? Object.keys(pkg.dependencies) : [],
    output: {
      name: 'Figure',
      file,
      format,
      sourcemap: true,
      globals: format === 'umd' ? {
        hilo3d: 'Hilo3d'
      } : {}
    },
    plugins: [
      ...pluginsBase(tsConfig)
    ],
  };
}


const arr = [];
const file = './lib/index.ts';
arr.push(
  distConfig(file, 'dist/index.esm.js', 'esm', pkg),
  distConfig(file, 'dist/index.cjs.js', 'cjs', pkg),
  distConfig(file, 'dist/index.umd.js', 'umd', pkg),
);

module.exports = [
  ...arr,
];
