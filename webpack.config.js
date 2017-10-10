const path = require('path')
const webpack = require('webpack')

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}

module.exports = {
  entry: {
    app: './overview.js',

  },
  output: {
    path: __dirname + '/',
    filename: '[name].js'
  },

  plugins: [
    new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery'
    })
  ],

  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif|woff|woff2|eot|ttf|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { importLoaders: 1 } },
          // 'postcss-loader'
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      '@': resolve('src')
    }
  },

  devServer: {
    historyApiFallback: true,
    noInfo: true
  },
  performance: {
    hints: false
  },

  devtool: '#eval-source-map'
}
