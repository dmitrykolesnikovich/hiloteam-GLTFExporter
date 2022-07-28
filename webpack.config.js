const HtmlWebpackPlugin = require('html-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
  entry: './demo/index.ts',
  output: {
    filename: 'index.js',
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.ts?$/i,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: "../dev.tsconfig.json"
            }
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './demo/index.html',
    }),
    new ESLintPlugin({
      extensions: ['ts'],
      fix: true,
    }),
  ],
  devServer: {
    static: './demo/',
    compress: true,
    port: 9001,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      progress: true,
    }
  },
};