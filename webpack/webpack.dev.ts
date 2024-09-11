import type { Configuration as WebpackConfiguration } from 'webpack';
import type { Configuration as DevServerConfiguration } from 'webpack-dev-server';
import { merge } from 'webpack-merge';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';

import common from './webpack.common';

interface Configuration extends WebpackConfiguration {
    devServer?: DevServerConfiguration;
}

const devConfig: Configuration = merge(common, {
    mode: 'development',
    cache: {
        type: 'filesystem',
        buildDependencies: {
            config: [__filename],
        },
    },

    devtool: 'eval-source-map',

    devServer: {
        allowedHosts: 'all',
        host: '0.0.0.0',
        historyApiFallback: true,
        open: 'http://localhost:3000/',
        compress: true,
        port: 3000,
        hot: true,
        client: {
            overlay: true,
        }
    },

    module: {
        rules: [
            {
                test: /\.(scss|css)$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: { sourceMap: true, importLoaders: 1, modules: { auto: true } },
                    },
                    { loader: 'sass-loader', options: { sourceMap: true } },
                ],
            },
            {
                test: /\.(j|t)sx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            plugins: ['react-refresh/babel'],
                        },
                    },
                ],
            },
        ],
    },

    plugins: [new ReactRefreshWebpackPlugin()],
});

export default devConfig;
