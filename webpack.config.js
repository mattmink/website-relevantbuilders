const path = require('path');
const { lstatSync, readdirSync, readFileSync } = require('fs');
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
    module: {
        rules: [
            {
                test: /\.(html)$/,
                include: path.resolve('./src/pages'),
                use: {
                    loader: 'html-loader',
                }
            },
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            ...templateConfig,
            title: 'Home',
            templateParameters: {
                pageContent: readFileSync(`./src/pages/index.html`, 'utf8'),
            },
            chunks: ['common', 'home'],
        }),
        ...pages.map((page) => new HtmlWebpackPlugin({
            ...templateConfig,
            title: page.toUpperCase(),
            filename: `${page}/index.html`,
            templateParameters: {
                pageContent: readFileSync(`./src/pages/${page}/index.html`, 'utf8'),
            },
            chunks: ['common', page],
        }))
    ],
    output: {
        filename: (pathData) => (['home', 'common'].includes(pathData.chunk.name) ? '[name].[hash].js' : '[name]/[name].[hash].js'),
        path: path.resolve(__dirname, 'dist'),
    },
    devServer: {
        contentBase: './dist',
    },
};
