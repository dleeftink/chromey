const path = require('path');

module.exports = {
  mode: 'production',
  entry: './source/index.ts',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  }
}