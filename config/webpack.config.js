var path = require('path');
var webpack = require('webpack');

module.exports = {
  context: __dirname + '/../src/js',

  entry: {
    popup: './popup.js',
    content: './content/index.js',
    common: [
      'jquery',
      'bluebird',
    ],
  },

  output: {
    path: path.resolve(__dirname, '../build'),
    pathinfo: true,
    filename: '[name].js',
    sourceMapFilename: '[name].map',
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /\/node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.css$/,
        loader: 'style!css',
      },
      {
        test: /\.tpl$/,
        loader: 'raw',
      },
      {
        test: /\.html$/,
        loader: 'raw',
      },
      {
        test: /\.png$/,
        loader: 'url?limit=10000&name=assets/[name].[ext]',
      },
    ],

    // noParse: /\/node_modules/
  },

  resolve: {
    extensions: ['.js', '.json'],
    modules: [
      '../node_modules',
    ],
  },

  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
   new webpack.optimize.CommonsChunkPlugin({
      name: 'common',
      filename: 'common.js',
    }),
 ],
};
