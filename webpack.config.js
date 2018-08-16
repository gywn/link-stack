const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WebpackMakefilePlugin = require("./lib/webpack-makefile-plugin");

module.exports = {
  entry: {
    background: __dirname + "/src/background.ts",
    view: __dirname + "/src/view.tsx"
  },
  output: { path: __dirname + "/dist", filename: "[name].js" },
  plugins: [
    new WebpackMakefilePlugin({
      watchFiles: [
        "manifest/manifest.json",
        "_locales/*/messages.json",
        "images/icon.svg"
      ]
    }),
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      title: "Loading...",
      filename: __dirname + "/dist/view.html",
      template: __dirname + "/html/view.html",
      inject: "head",
      chunks: ["view"]
    })
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: "babel-loader"
      },
      {
        test: /\.less$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          "css-loader",
          {
            loader: "less-loader",
            options: {
              javascriptEnabled: true // Ant Design's requirement
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: [".js", ".ts", ".tsx"]
  },
  devtool: false // to avoid `eval` in development mode
};
