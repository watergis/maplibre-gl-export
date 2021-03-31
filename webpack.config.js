const webpack = require('webpack');
const path = require('path');

module.exports = {
    mode: 'development',
    entry: './example/index.js',
    plugins: [
        new webpack.ProvidePlugin({
            Promise: 'es6-promise',
        }),
    ],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'example'),
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: [
                'style-loader',
                'css-loader',
                ],
            },
        ],
    },
    resolve: {
        extensions: [
          '.ts', '.js',
        ],
    },
    devtool: 'inline-source-map',
    devServer: {
        watchContentBase: true,
        contentBase: './example',
    },
    externals: {
        'maplibre-gl': 'maplibregl'
    }
};