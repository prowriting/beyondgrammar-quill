var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');

const ROOT = path.resolve('.');

module.exports = {
  mode: 'development',
  watch: true,
  stats: {
    colors: true,
    reasons: true
  },

  output: {
    path: path.resolve('dist'),
    filename: '[name].js',
    chunkFilename: '[id].chunk.js'
  },

  entry: {
    'beyond-grammar-plugin': "./src/beyond_grammar_quill.ts"
  },

  resolve: {
    extensions: ['.ts', '.es6', '.js', '.json'],
    modules: [
      path.join(ROOT, "modules"),
      path.join(ROOT, 'node_modules'),
      'node_modules'
    ]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.png$/,
        use: 'url-loader'
      }
    ]
  },

  devServer: {
    contentBase: './dist',
    index: 'quill.html',
    quiet: false,
    proxy: {
      "/api/v1": {
        target: "http://rtgrammarapi.azurewebsites.net/",
        changeOrigin: true
      },
      "/api/language": {
        target: "http://rtgrammarapi.azurewebsites.net/",
        changeOrigin: true
      }
    }
  },

  plugins: [
    new CopyWebpackPlugin([{
        from: './src/quill.html',
        to: './'
      },
      {
        context: './src',
        from: {
          glob: './icons/**/*'
        },
        to: './'
      },
    ])
  ],
};
