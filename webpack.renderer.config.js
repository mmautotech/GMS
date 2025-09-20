// app/webpack.renderer.config.js
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
require("dotenv").config();

const rules = require("./webpack.rules");

// ✅ Add CSS/PostCSS/Tailwind support
rules.push({
  test: /\.css$/,
  use: [
    { loader: "style-loader" },
    { loader: "css-loader" },
    {
      loader: "postcss-loader",
      options: {
        postcssOptions: {
          plugins: [require("tailwindcss"), require("autoprefixer")],
        },
      },
    },
  ],
});

module.exports = {
  module: { rules },
  plugins: [
    new webpack.DefinePlugin({
      // ✅ Inject API_BASE into renderer bundle
      "process.env.API_BASE": JSON.stringify(
        process.env.API_BASE || "http://192.168.18.84:5000/api"
      ),
    }),
    // ✅ Copy static assets if needed in renderer (e.g., logos)
    new CopyPlugin({
      patterns: [{ from: "src/assets", to: "assets" }],
    }),
  ],
  devServer: {
    headers: {
      "Content-Security-Policy": [
        "default-src 'self' data: blob:",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self' http://127.0.0.1:5000 http://192.168.18.84:5000 ws: http: https:",
        "worker-src 'self' blob:",
      ].join("; "),
    },
  },
};
