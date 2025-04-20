import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCSSExtractPlugin from 'mini-css-extract-plugin';
import path from 'node:path';
import TerserPlugin from 'terser-webpack-plugin';
import type { Configuration as WebpackConfiguration } from 'webpack';
import type { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';
import { GenerateSW } from 'workbox-webpack-plugin';

interface Configuration extends WebpackConfiguration {
  devServer?: WebpackDevServerConfiguration;
}

export default (env: Record<string, string>, argv: Configuration): Configuration => {
  const isProduction = argv.mode === 'production';

  const entryFiles = {
    main: path.join(path.resolve(), './src/scripts/main.ts'),
  };

  const basePlugins = [
    new MiniCSSExtractPlugin({
      filename: isProduction ? '[name]-bundle.[contenthash:8].css' : '[name]-bundle.css',
    }),
    new HtmlWebpackPlugin({
      title    : 'Chip8 Emulator',
      template : path.join(path.resolve(), './src/html/index.html'),
    }),
    new FaviconsWebpackPlugin({
      logo         : path.join(path.resolve(), './src/resources/favicon.svg'),
      logoMaskable : path.join(path.resolve(), './src/resources/maskable.svg'),
      mode         : 'webapp',
      favicons     : {
        appName             : 'Chip8 Emulator',
        appDescription      : 'A Chip-8, Super Chip-8 (SCHIP), and XO-CHIP emulator written in TypeScript.',
        background          : '#222222',
        theme_color         : '#222222',
        start_url           : '/',
        appleStatusBarStyle : 'black-translucent',
        version             : '1.0',
        icons               : {
          android      : true,
          appleIcon    : true,
          appleStartup : true,
          favicons     : true,
          windows      : true,
          yandex       : true,
        },
      },
      manifest: path.join(path.resolve(), './src/resources/templates/manifest.json'),
    }),
  ];

  const prodPlugins = isProduction ?
    [
      new GenerateSW({
        clientsClaim          : true,
        skipWaiting           : true,
        navigateFallback      : 'index.html',
        cleanupOutdatedCaches : true,
      }),
    ] :
    [];

  const plugins = [ ...basePlugins, ...prodPlugins ];

  if (isProduction) {
    Object.assign(entryFiles, {
      register_service: path.join(path.resolve(), './src/scripts/service-worker.ts'),
    });
  }

  return {
    entry  : { ...entryFiles },
    output : {
      path     : path.join(path.resolve(), 'dist'),
      filename : isProduction ? '[name]-bundle.[contenthash:8].js' : '[name]-bundle.js',
      clean    : true,
    },
    watchOptions: {
      ignored: '**/node_modules',
    },
    resolve: {
      extensions: [ '.ts', '.js' ],
    },
    resolveLoader: {
      modules: [ 'node_modules' ],
    },
    module: {
      rules: [
        {
          test   : /\.tsx?$/,
          loader : 'ts-loader',
        },
        {
          test : /\.css$/,
          use  : [
            {
              loader: MiniCSSExtractPlugin.loader,
            },
            {
              loader: 'css-loader',
            },
            {
              loader  : 'postcss-loader',
              options : {
                postcssOptions: {
                  plugins: [
                    'autoprefixer',
                  ],
                },
              },
            },
          ],
        },
        {
          test : /\.svg$/,
          type : 'asset/source',
        },
      ],
    },
    optimization: {
      minimizer: [
        new CssMinimizerPlugin(),
        new TerserPlugin(),
      ],
    },
    mode      : isProduction ? 'production' : 'development',
    plugins   : [ ...plugins ],
    devServer : {
      static   : path.join(path.resolve(), 'dist'),
      compress : true,
      port     : 4000,
      open     : true,
    },
  };
};
