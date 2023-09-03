import path from 'node:path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import MiniCSSExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

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
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCSSExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
          },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  'autoprefixer'
                ]
              }
            }
          },
        ],
      },
    ]
  },
  optimization: {
    minimizer: [
      new CssMinimizerPlugin(),
    ],
  },
  plugins: [
    new MiniCSSExtractPlugin({
      filename: '[name]-bundle.css',
    }),
    new HtmlWebpackPlugin({
      title: 'Chip8 Emulator',
      template: path.join(path.resolve(), './src/html/index.html'),
    }),
    new FaviconsWebpackPlugin({
      logo: path.join(path.resolve(), './src/static/favicon.svg'),
      favicons: {
        appName: 'Chip8 Emulator',
        appDescription: 'A Chip-8 emulator written in Typescript.',
        background: '#222222',
        theme_color: '#222222',
        mode: 'webapp',
        start_url: '/',
        appleStatusBarStyle: 'black-translucent',
        version: '1.0',
        icons: {
          android: true,
          appleIcon: true,
          appleStartup: true,
          favicons: true,
          windows: true,
          yandex: true,
        },
      },
    }),
  ],
  devServer: {
    static: path.join(path.resolve(), 'dist'),
    compress: true,
    port: 4000,
    open: true,
  },
}
