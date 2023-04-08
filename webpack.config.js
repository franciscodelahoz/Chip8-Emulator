import path from 'node:path';
import HtmlWebpackPlugin from 'html-webpack-plugin';

export default {
  entry: {
    main: path.join(path.resolve(), './src/scripts/main.ts'),
  },
  output: {
    path: path.join(path.resolve(), 'dist'),
    filename: '[name]-bundle.js'
  },
  watchOptions: {
    ignored: '**/node_modules',
  },
  resolve: {
    extensions: [ '.ts', '.js' ],
  },
  resolveLoader: {
    modules: ['node_modules']
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' },
      { test: /\.css$/, use: [ 'style-loader', 'css-loader' ] },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Chip8 Emulator',
      template: path.join(path.resolve(), './src/html/index.html'),
    }),
  ],
  devServer: {
    static: path.join(path.resolve(), 'dist'),
    compress: true,
    port: 4000,
    open: true,
  },
}
