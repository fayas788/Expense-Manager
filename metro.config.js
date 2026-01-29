const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    assert: path.resolve(__dirname, "node_modules/assert"),
    util: path.resolve(__dirname, "node_modules/util"),
    process: path.resolve(__dirname, "node_modules/process"),
    events: path.resolve(__dirname, "node_modules/events"),
    path: path.resolve(__dirname, "node_modules/path-browserify"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
