import path from 'node:path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import MiniCSSExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import { GenerateSW } from 'workbox-webpack-plugin';

export default (env, argv) => {
  const isProduction = argv.mode === 'production';

  const entryFiles = {
    main: path.join(path.resolve(), './src/scripts/main.ts'),
  };

  const plugins = [
    new MiniCSSExtractPlugin({
      filename: '[name]-bundle.css',
    }),
    new HtmlWebpackPlugin({
      title: 'Chip8 Emulator',
      template: path.join(path.resolve(), './src/html/index.html'),
    }),
    new FaviconsWebpackPlugin({
      logo: path.join(path.resolve(), './src/resources/favicon.svg'),
      logoMaskable: path.join(path.resolve(), './src/resources/maskable.svg'),
      favicons: {
        appName: 'Chip8 Emulator',
        appDescription: 'A Chip-8, Super Chip-8 (SCHIP), and XO-CHIP emulator written in TypeScript.',
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
      manifest: path.join(path.resolve(), './src/resources/templates/manifest.json'),
    }),
  ];

  if (isProduction) {
    plugins.push(
      new GenerateSW({
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      }),
    );

    Object.assign(entryFiles, {
      register_service: path.join(path.resolve(), './src/scripts/utils/service-worker-registration.ts'),
    });
  }

  return {
    entry: { ...entryFiles },
    output: {
      path: path.join(path.resolve(), 'dist'),
      filename: '[name]-bundle.js',
      clean: true,
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
        {
          test: /\.tsx?$/,
          loader: 'ts-loader'
        },
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
        {
          test: /\.svg$/,
          type: 'asset/source',
        },
      ],
    },
    optimization: {
      minimizer: [
        new CssMinimizerPlugin(),
        new TerserPlugin(),
      ],
    },
    plugins: [ ...plugins ],
    devServer: {
      static: path.join(path.resolve(), 'dist'),
      compress: true,
      port: 4000,
      open: true,
    },
  }
}
