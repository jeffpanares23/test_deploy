const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
     entry: {
          main: './index.js'
     },
     output: {
          path: path.join(__dirname, 'prod-build-optimization'),
          publicPath: '/',
          filename: '[name].js',
          clean: true
     },
     mode: 'production',
     target: 'node',
     optimization: {
          minimize: true,
          minimizer: [new TerserPlugin({
               terserOptions: {
                    compress: {
                         drop_console: true
                    }
               }
          })]
     },
     //devtool: 'source-map',
     module: {
          rules: [
               {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: "babel-loader",
               }
          ]
     }
}