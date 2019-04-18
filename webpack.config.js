const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const SriPlugin = require('webpack-subresource-integrity');
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
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
       title: 'hundredeyes',
       template: './src/index.html'
    }),
    new CopyPlugin([
      { from: './public', to: '.' }
    ]),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: devMode ? '[name].css' : '[name].[hash].css',
      chunkFilename: devMode ? '[id].css' : '[id].[hash].css',
    }),
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
      },
      {
        test: /\.module\.s(a|c)ss$/,
        loader: [
          devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: true,
              localIdentName: '[name]__[local]___[hash:base64:5]',
              camelCase: true,
              sourceMap: devMode
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: devMode
            }
          }
        ]
      },
      {
        test: /\.s(a|c)ss$/,
        exclude: /\.module.(s(a|c)ss)$/,
        loader: [
          devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              sourceMap: devMode
            }
          }
        ]
      }
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
