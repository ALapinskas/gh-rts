import { loadEnvFile } from 'node:process';

loadEnvFile("./.env");
import webpack from 'webpack';

var config = {
    entry: "./src/index.js",
    output: {
        filename: "index.es6.js",
        library: {
            type: 'module'
        },
    },
    devServer: {
        static: ["dist"],
        compress: false,
        hot: false,
        port: 9000,
    },
    experiments: {
        topLevelAwait: true,
        syncWebAssembly: true,
        outputModule: true,
    },
    resolve: {
        fallback: {
            "fs": false,
            "https": false,
            "http": false,
            "url": false,
            "stream": false,
            "crypto": false,
            "zlib": false,
            "utf-8-validate": false,
            "bufferutil": false,
            "net": false,
            "tls": false,
            "child_process": false
        },
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                loader: 'babel-loader',
                },
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
            ],
    }
    //presets: ["@babel/env", "@babel/react"],
    //target: "web"
};

/**
 * Remove system environments
 * @param {Object} env 
 * @param {string} mode 
 * @returns {Object}
 */
function filterProcessEnv (env, mode) {
    let resultEnv = {}
    Object.keys(env).forEach((key) => {
        if (key.includes("PROD_") || key.includes("DEV_")) {
            resultEnv[key] = env[key];
        }
    });
    resultEnv.MODE = mode;
    return resultEnv;
}
export default (env, argv) => {
    if (argv.mode === "development") {
        config.devtool = "source-map";
    }

    if (argv.mode === "production") {
        config.output.filename = "index.es6.min.js";
    }

    config.plugins = [
        // ...
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(filterProcessEnv(process.env, argv.mode))
        }),
        
        // ...
    ]
    //config.dotenv = true;
    /*
    if (argv.mode === "production-es5") {
        config.output.filename = "index.es5.min.js";
        config.library.type = 'commonjs';
    }

    if (argv.mode === "production-global") {
        config.output.filename = "index.min.js";
        config.library.type = 'window';
    }*/
    return config;
};