const path = require('path');
const webpack = require("webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    entry: {
        index: [
            path.resolve(__dirname, 'app/entry.js')
        ]
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'js/[name].bundle.js'
    },
    module: {
        loaders: [
            { test: /\.js$/, exclude: /node_modules/, loader: 'babel', query: { presets: [ 'es2015'] } },
            { test: /\.css$/, loader: ExtractTextPlugin.extract("style-loader", "css-loader") },
            { test: /\.scss$/, loader: ExtractTextPlugin.extract("style-loader", "css-loader!sass-loader") },
            { test: /\.(png|jpg|gif|webp)$/, loader: 'url?limit=25000&name=img/[hash:8].[ext]' }
        ]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new ExtractTextPlugin("css/[name].css")
    ]
};