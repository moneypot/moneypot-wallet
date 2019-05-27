const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const SriPlugin = require('webpack-subresource-integrity');
const devMode = process.env.NODE_ENV !== 'production';


module.exports = {
  mode: 'development',
  entry: './src/index.tsx',
  devtool: 'source-map',
  plugins: [
    new SriPlugin({
        hashFuncNames: ['sha256'],
        enabled: process.env.NODE_ENV === 'production',
    }),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
       title: 'hookedin wallet',
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
        use: ['style-loader', 'scss-loader'],
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'scss-loader', 'sass-loader'],
      },
      {
        test: /\.(png|jpg|svg|eot|woff|woff2|ttf)$/i,
        use: [
          'file-loader'
        ],
      },
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js', '.css', '.scss' ]
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
