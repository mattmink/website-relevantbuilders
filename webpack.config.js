const path = require('path');
const { lstatSync, readdirSync, readFileSync } = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { TemplateBuilderPlugin } = require('./template-builder');
const WatchFilesPlugin = require('webpack-watch-files-plugin').default;
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const seo = require('./public/seo');

const pagesRoot = path.resolve(__dirname, './public/pages');
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
    template: path.resolve(__dirname, './public/templates/index.html'),
    favicon: path.resolve(__dirname, './public/assets/favicon.ico'),
    templateParameters: {
        include: filePath => readFileSync(path.resolve('./public/templates', filePath), 'utf8'),
    },
};

module.exports = (_, { mode = 'development', analyze }) => {
    const config = {
        entry: {
            common: './public/common.js',
            home: './public/pages/index.js',
            ...pages.reduce((pageEntries, page) => {
                pageEntries[page] = `./public/pages/${page}`;
                return pageEntries;
            }, {})
        },
        resolve: {
            alias: {
                icons: path.resolve(__dirname, './node_modules/feather-icons/dist/icons/'),
                images: path.resolve(__dirname, './public/assets/images'),
                '@': path.resolve(__dirname, './public/'),
            }
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /(node_modules)/,
                    use: {
                        loader: 'babel-loader',
                    }
                },
                {
                    test: /\.svg(\?.*)?$/,
                    oneOf: [
                        {
                            resourceQuery: /fill=/,
                            use: [
                                'svg-url-loader',
                                'svg-transform-loader'
                            ]
                        },
                        {
                            use: [
                                {
                                    loader: path.resolve('./svg-icon-loader.js'),
                                },
                                'html-loader'
                            ]
                        }
                    ]
                },
                {
                    test: /\.(html)$/,
                    include: [path.resolve('./public/pages'), path.resolve('./public/components')],
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
                    test: /\.(gif|png|jpe?g)$/,
                    use: [
                        {
                            loader: 'file-loader',
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
            new HtmlWebpackPlugin({
                ...templateConfig,
                ...seo.home,
                chunks: ['home', 'common'],
            }),
            ...pages.map((page) => new HtmlWebpackPlugin({
                ...templateConfig,
                title: page.toUpperCase(),
                filename: `${page}/index.html`,
                chunks: [page, 'common'],
            })),
            new TemplateBuilderPlugin({ mode }),
            new MiniCssExtractPlugin({
                filename: '[name].[hash].css',
            })
        ],
        output: {
            filename: (pathData) => (['home', 'common'].includes(pathData.chunk.name) ? '[name].[hash].js' : '[name]/[name].[hash].js'),
            path: path.resolve(__dirname, 'dist'),
        },
        stats: 'errors-warnings',
        devServer: {
            contentBase: './dist',
            proxy: {
                '/api': 'http://localhost:3000',
            },
        },
    };
    if (mode === 'development') {
        config.plugins.push(
            new WatchFilesPlugin({
                files: ['./public/**/*.html'],
            })
        );
    }
    if (analyze) {
        config.plugins.push(new BundleAnalyzerPlugin());
    }
    return config;
};
