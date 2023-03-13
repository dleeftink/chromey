const path = require('path');
const webpack = require('webpack');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './source/index.ts',
   experiments: {
    outputModule:true
  },
  // devtool: 'inline-source-map',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    // globalObject: 'this',
    library: {
      name: 'chromey',
      type: 'var',
      export: 'default',
    },
    module: true
  },
  target: 'web',
  resolve: {
    modules: ['node_modules'],
    // preferRelative: true,
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    // Use our versions of Node modules.
    fallback: {
      fs: require.resolve("browserify-fs"),
     /* assert: require.resolve("assert"), // has /
      constants : require.resolve("constants-browserify"),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      stream: require.resolve('stream-browserify'),
      url: require.resolve('url'), // has /
      util: require.resolve("util"), // has */
      zlib: require.resolve("browserify-zlib")
    },
    alias: {
      //fs: 'browserfs/dist/shims/fs.js',
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
        test: /\.(js|jsx|tsx|ts)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-transform-modules-commonjs',
            ],
          },
        },
      },
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
    new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
      resource.request = resource.request.replace(/^node:/, '');
    }),
    new webpack.ProvidePlugin({
      BrowserFS: 'bfsGlobal',
      process: 'processGlobal',
      Buffer: 'bufferGlobal',
    }),
    new NodePolyfillPlugin({
      excludeAliases: ['fs', 'buffer'/*, 'path'*/, 'Buffer'],
    }),
  ],
  // DISABLE Webpack's built-in process and Buffer polyfills!
  node: {
    global: true,
  },
};
