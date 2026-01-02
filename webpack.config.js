import * as path from "path";

import webpack from 'webpack';
import dotenv from 'dotenv'

dotenv.config({ path: './.env' });

var config = {
    entry: "./src/index.js",
    //output: {
    //    path: path.resolve("dist"),
    //    filename: "index.js",
    //    chunkFormat: "module",
    //    module: true,
        //libraryTarget: 'umd',
    //},
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
    },
    plugins: [
        // ...
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(process.env)
        })
        // ...
    ]
    //presets: ["@babel/env", "@babel/react"],
    //target: "web"
};

export default (env, argv) => {
    if (argv.mode === "development") {
        config.devtool = "source-map";
    }

    if (argv.mode === "production") {
        config.output.filename = "index.es6.min.js";
    }
    
    config.dotenv = true;
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