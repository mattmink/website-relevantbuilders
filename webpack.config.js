const path = require('path');
const { lstatSync, readdirSync } = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const pagesRoot = path.resolve(__dirname, 'src/pages');
const isDirectory = (source) => lstatSync(source).isDirectory();
const getDirectories = (source) => readdirSync(source)
    .map((name) => path.join(source, name))
    .filter(isDirectory)
    .reduce((mapped, dir) => {
        mapped.push(dir, ...getDirectories(dir));
        return mapped;
    }, []);
const pages = getDirectories(pagesRoot).map((dir) => dir.replace(`${pagesRoot}/`, ''));
const templateConfig = {
    template: path.resolve(__dirname, './src/public/index.html'),
    favicon: path.resolve(__dirname, './src/public/favicon.ico'),
};

module.exports = {
    entry: {
        common: './src/common.js',
        home: './src/pages/index.js',
        ...pages.reduce((pageEntries, page) => {
            pageEntries[page] = `./src/pages/${page}`;
            return pageEntries;
        }, {})
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            ...templateConfig,
            title: 'Home',
            chunks: ['common', 'home'],
        }),
        ...pages.map((page) => new HtmlWebpackPlugin({
            ...templateConfig,
            title: page.toUpperCase(),
            filename: `${page}/index.html`,
            chunks: ['common', page],
        }))
    ],
    output: {
        filename: (pathData) => (['home', 'common'].includes(pathData.chunk.name) ? '[id].[hash].js' : '[name]/[id].[hash].js'),
        path: path.resolve(__dirname, 'dist'),
    },
    devServer: {
        contentBase: './dist',
    },
};
