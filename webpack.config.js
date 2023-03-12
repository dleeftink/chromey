const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: './source/index.ts',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    // Use our versions of Node modules.
    alias: {
      fs: 'browserfs/dist/shims/fs.js',

      buffer: 'browserfs/dist/shims/buffer.js',

      path: 'browserfs/dist/shims/path.js',

      processGlobal: 'browserfs/dist/shims/process.js',

      bufferGlobal: 'browserfs/dist/shims/bufferGlobal.js',
      bfsGlobal: require.resolve('browserfs'),
    },
  },
  // REQUIRED to avoid issue "Uncaught TypeError: BrowserFS.BFSRequire is not a function"
  // See: https://github.com/jvilk/BrowserFS/issues/201
  module: {
    noParse: /browserfs\.js/,
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    // Expose BrowserFS, process, and Buffer globals.
    // NOTE: If you intend to use BrowserFS in a script tag, you do not need
    // to expose a BrowserFS global.
    new webpack.ProvidePlugin({
      BrowserFS: 'bfsGlobal',
      process: 'processGlobal',
      Buffer: 'bufferGlobal',
    }),
    new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
      const mod = resource.request.replace(/^node:/, "");
      switch (mod) {
          case "fs":
              resource.request = "fs";
              break;
          case "buffer":
              resource.request = "buffer";
              break;
          case "path":
              resource.request = "path";
              break;
          case "process":
              resource.request = "processGlobal";
              break;
         case "http":
              resource.request = "http";
              break;
          case "os":
              resource.request = "os";
              break;
          case "url":
              resource.request = "url";
              break;
          case "zlib":
              resource.request = "zlib";
              break;
          default:
              throw new Error(`Not found ${mod}`);
      }
    }),
  ],
  // DISABLE Webpack's built-in process and Buffer polyfills!
  node: false,
};
