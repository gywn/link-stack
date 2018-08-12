const path = require("path");
const WebpackShellPlugin = require("webpack-shell-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    background: __dirname + "/src/background.ts",
    "content-persistent": __dirname + "/src/content-persistent.ts",
    view: __dirname + "/src/view.tsx"
  },
  output: { path: __dirname + "/dist", filename: "[name].js" },
  plugins: [
    new WebpackShellPlugin({
      onBuildStart: ["bash build-2.sh"]
    }),
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      title: "Link Stack",
      filename: __dirname + "/dist/view.html",
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
              javascriptEnabled: true
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: [".js", ".ts", ".tsx"]
  },
  devtool: false
};
