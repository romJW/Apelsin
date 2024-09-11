import type { Configuration } from 'webpack';

import HtmlWebpackPlugin from 'html-webpack-plugin';

import paths from './paths';
import dotenv from "dotenv";

import webpack from "webpack";

const env = dotenv.config().parsed;

// reduce it to a nice object, the same as before
const envKeys = env && Object.keys(env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {}) || {};

const config: Configuration = {
  entry: [paths.src + '/components/index.tsx'],

  output: {
    path: paths.build,
    clean: true,
    filename: '[name].bundle.js',
    publicPath: '/',
  },

  plugins: [

    new HtmlWebpackPlugin({
      // favicon: paths.public + '/favicon.png',
      inject: 'body',
      template: paths.src + '/components/index.html',
      filename: 'index.html',
    }),
    new webpack.DefinePlugin(envKeys),
  ],

  module: {
    rules: [
      { test: /\.(j|t)sx?$/, exclude: /node_modules/, use: ['babel-loader'] },

      {
        test: /\.svg$/,
        issuer: /\.(t|j)sx?$/,
        use: ['@svgr/webpack'],
      },
      {
        test: /\.svg$/,
        issuer: /\.(scss|css)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[hash][ext]',
        },
      },
      {
        test: /\.(?:ico|gif|png|jpg|jpeg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[hash][ext]',
        },
      },

      {
        test: /\.(woff(2)?|eot|ttf|otf|)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name][ext]',
        },
      },
    ],
  },

  resolve: {
    // modules: [paths.src, 'node_modules'],
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
    alias: {
      '@api': paths.src + '/api',
      '@assets': paths.src + '/assets',
      '@classes': paths.src + '/classes',
      '@components': paths.src + '/components',
      '@constants': paths.src + '/constants',
      '@enums': paths.src + '/enums',
      types: paths.src + '/types',
      '@atoms': paths.src + '/ui/atoms',
      '@molecules': paths.src + '/ui/molecules',
      '@organisms': paths.src + '/ui/organisms',
      '@pages': paths.src + '/ui/pages',
      "@utils": paths.src + '/utils',
      "@store": paths.src + '/store'
    },
  }
};

export default config;
