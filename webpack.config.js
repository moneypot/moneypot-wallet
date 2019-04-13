const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const SriPlugin = require('webpack-subresource-integrity');


module.exports = {
  mode: 'development',
  entry: './src/index.tsx',
  devtool: 'source-map',
  plugins: [
    new SriPlugin({
        hashFuncNames: ['sha256'],
        enabled: true,
    }),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
       title: 'hundredeyes',
       template: './src/index.html'
    }),
    new CopyPlugin([
      { from: './public', to: '.' }
    ]),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|svg)$/i,
        use: [
          'file-loader'
        ],
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js', '.css' ]
  },
  output: {
    crossOriginLoading: 'anonymous',
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: process.env.USE_CDN ? "https://wallet.hookedin.com/" : "/"
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 9000,
    filename: '[name].[contenthash].js',
    historyApiFallback: true,
  },
//   optimization: {
//          runtimeChunk: 'single',
//          splitChunks: {
//            cacheGroups: {
//              vendor: {
//                test: /[\\/]node_modules[\\/]/,
//                name: 'vendors',
//                chunks: 'all'
//            }
//         }
//      }
//  }
};
