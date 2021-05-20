const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const path = require('path');
const fse = require('fs-extra');

const currentTask = process.env.npm_lifecycle_event;


const postCSSPlugins = [
    require('postcss-import'),
    require('postcss-mixins'),
    require('postcss-simple-vars'),
    require('postcss-nested'),
    require('autoprefixer')
];

class RunAfterCompile {
    apply(compiler) {
        compiler.hooks.done.tap('Copy images', ()=>{
            fse.copySync('./app/assets/images', './docs/assets/images')
        })
    }
}

let cssConfig = {
    test: /\.css$/i,
    use: ['css-loader?url=false', {loader: 'postcss-loader', options: {postcssOptions: {plugins: postCSSPlugins}}}]
}


let config = {
    entry: './app/assets/scripts/App.js', 
    plugins: [new HtmlWebpackPlugin({
        template: './app/index.html',
        filename: 'index.html'
    })],
    module: {
        rules: [
            cssConfig
        ]
    }
}

if (currentTask === 'dev') {
    cssConfig.use.unshift('style-loader')
    config.output = {
        filename: 'bundled.js',
        path: path.resolve(__dirname,'app')
    }, 

    config.devServer = {
        before: (app,server)=>{
            server._watch('./app/**/*.html')
        }, 
        contentBase: path.join(__dirname, 'app'),
        hot: true,
        port: 3000,
        host: '0.0.0.0'
    }

    config.mode = "development";
}

if (currentTask === 'build') {
    config.module.rules.push({
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
            loader: 'babel-loader',
            options: {
                presets: ['@babel/preset-env']
            }
        }
    })

    cssConfig.use.unshift(MiniCssExtractPlugin.loader);
    config.output = {
        filename: '[name].[chunkhash].js',
        chunkFilename: '[name].[chunkhash].js',
        path: path.resolve(__dirname,'docs')
    }

    config.mode = "production";
    config.optimization = {
        splitChunks: {chunks: 'all'}, 
        minimize: true, 
        minimizer: [`...`, new CssMinimizerPlugin()]
    }

    config.plugins.push(
        new CleanWebpackPlugin(), 
        new MiniCssExtractPlugin({filename: "styles.[chunkhash].css"}),
        new RunAfterCompile()
        );
}

module.exports = config;