const { parsed: localEnv } = require("dotenv").config();

const webpack = require("webpack");
const apiKey = JSON.stringify(process.env.SHOPIFY_API_KEY);

module.exports = {
  webpack: (config) => {
    const env = { API_KEY: apiKey };
    config.plugins.push(new webpack.DefinePlugin(env));

    // Add ESM support for .mjs files in webpack 4
    config.module.rules.push(
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: "javascript/auto",
      },
      {
        test: /\.(jpe?g|png|gif|woff|woff2|eot|ttf|svg|wav|mp3)(\?[a-z0-9=.]+)?$/,
        loader: "url-loader?limit=100000",
      },
      {
        test: /\.wav$/,
        loader: "file-loader"
      },
    );

    return config;
  },
};
