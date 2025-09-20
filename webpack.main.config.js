// app/webpack.main.config.js
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
require("dotenv").config();

module.exports = {
  entry: "./src/main.js",
  module: { rules: require("./webpack.rules") },
  plugins: [
    // ✅ Inject environment variable
    new webpack.DefinePlugin({
      "process.env.API_BASE": JSON.stringify(
        process.env.API_BASE || "http://192.168.18.84:5000/api"
      ),
    }),

    // ✅ Copy static assets (splash.html, images, etc.)
    new CopyPlugin({
      patterns: [
        { from: "src/assets", to: "assets" },
        // now splash.html will end up in .webpack/main/assets/
      ],
    }),
  ],
};
