const path = require('path');
const { lstatSync, readdirSync, readFileSync } = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { TemplateBuilderPlugin } = require('./template-builder');
const WatchFilesPlugin = require('webpack-watch-files-plugin').default;

const pagesRoot = path.resolve(__dirname, 'src/public/pages');
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
    chunksSortMode: 'manual',
    template: path.resolve(__dirname, './src/public/templates/index.html'),
    favicon: path.resolve(__dirname, './src/public/assets/favicon.ico'),
    templateParameters: {
        include: filePath => readFileSync(path.resolve('./src/public/templates', filePath), 'utf8'),
    },
};

module.exports = {
    entry: {
        common: './src/public/common.js',
        home: './src/public/pages/index.js',
        ...pages.reduce((pageEntries, page) => {
            pageEntries[page] = `./src/public/pages/${page}`;
            return pageEntries;
        }, {})
    },
    resolve: {
        alias: {
            icons: path.resolve(__dirname, './node_modules/feather-icons/dist/icons/'),
            '@': path.resolve(__dirname, './src/public/'),
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            [
                                '@babel/preset-env',
                                {
                                    useBuiltIns: 'usage',
                                    corejs: '3.6.5',
                                }
                            ]
                        ]
                    }
                }
            },
            {
                test: /\.svg(\?.*)?$/,
                use: [
                    'svg-url-loader',
                    'svg-transform-loader'
                ]
            },
            {
                test: /\.(html)$/,
                include: path.resolve('./src/public/pages'),
                use: [
                    {
                        loader: path.resolve('./template-builder.js'),
                    },
                    {
                        loader: 'html-loader',
                    }
                ]
            },
            {
                test: /\.s?css$/i,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            hmr: process.env.NODE_ENV === 'development',
                        },
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1
                        }
                    },
                    'svg-transform-loader/encode-query',
                    'sass-loader',
                ],
            },
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new WatchFilesPlugin({
            files: ['./src/public/**/*.html'],
        }),
        new HtmlWebpackPlugin({
            ...templateConfig,
            title: 'Home',
            chunks: ['home', 'common'],
        }),
        ...pages.map((page) => new HtmlWebpackPlugin({
            ...templateConfig,
            title: page.toUpperCase(),
            filename: `${page}/index.html`,
            chunks: [page, 'common'],
        })),
        new TemplateBuilderPlugin(),
        new MiniCssExtractPlugin()
    ],
    output: {
        filename: (pathData) => (['home', 'common'].includes(pathData.chunk.name) ? '[name].[hash].js' : '[name]/[name].[hash].js'),
        path: path.resolve(__dirname, 'dist'),
    },
    devServer: {
        contentBase: './dist',
        hot: true,
        proxy: {
            '/api': 'http://localhost:3000',
        },
    },
};
