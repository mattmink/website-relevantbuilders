const path = require('path');
const { lstatSync, readdirSync, readFileSync, copySync, remove, removeSync, existsSync } = require('fs-extra');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const { TemplateBuilderPlugin } = require('./template-builder');
const WatchFilesPlugin = require('webpack-watch-files-plugin').default;
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const {
    defaultTitle,
    defaultDescription,
    baseTitle,
    pages: seoPages
} = JSON.parse(readFileSync(path.resolve(__dirname, './src/data/seo.json'), 'utf8'));

const getBodyClassFromPath = (pathStr = '/') => `page-${pathStr === '/' ? 'home' : pathStr.slice(1).split('/').join('-')}`;
const isDirectory = (source) => lstatSync(source).isDirectory();
const getDirectories = (source) => readdirSync(source)
    .map((name) => path.join(source, name))
    .filter(isDirectory)
    .reduce((mapped, dir) => {
        mapped.push(dir, ...getDirectories(dir));
        return mapped;
    }, []);


module.exports = (_, { mode = 'development', analyze }) => {
    const isDev = mode === 'development';
    const publicRoot = path.resolve(__dirname, './src');
    const pagesRoot = path.join(publicRoot, '/pages');
    const componentsRoot = path.join(publicRoot, '/components');

    const pages = getDirectories(pagesRoot).map((dir) => dir.replace(`${pagesRoot}/`, ''));
    const templateConfig = {
        chunksSortMode: 'manual',
        template: path.join(publicRoot, '/includes/template.html'),
        favicon: path.join(publicRoot, '/assets/favicon.ico'),
    };

    const config = {
        entry: {
            common: `./src/common.js`,
            home: `./src/pages/index.js`,
            ...pages.reduce((pageEntries, page) => {
                pageEntries[page] = `./src/pages/${page}`;
                return pageEntries;
            }, {})
        },
        resolve: {
            alias: {
                icons: path.resolve(__dirname, './node_modules/feather-icons/dist/icons/'),
                images: path.join(publicRoot, 'assets/images/'),
            },
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
                    test: /icons\/.*\.svg(\?.*)?$/,
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
                    test: /src\/assets\/.*\.svg(\?.*)?$/,
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
                                'file-loader'
                            ]
                        }
                    ]
                },
                {
                    test: /\.(html)$/,
                    include: [pagesRoot, componentsRoot],
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
                title: `${defaultTitle}${baseTitle}`,
                description: defaultDescription,
                pageClass: getBodyClassFromPath('/'),
                chunks: ['home', 'common'],
            }),
            ...pages.map((id) => {
                const pathStr = `/${id}`;
                const {
                    title = defaultTitle,
                    description = defaultDescription
                } = seoPages[pathStr] || {};

                return new HtmlWebpackPlugin({
                    ...templateConfig,
                    title: `${title}${baseTitle}`,
                    description,
                    pageClass: getBodyClassFromPath(pathStr),
                    filename: `${id}/index.html`,
                    chunks: [id, 'common'],
                });
            }),
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
        },
    };
    if (isDev) {
        config.plugins.push(
            new WatchFilesPlugin({
                files: ['./src/**/*.html'],
            })
        );
        config.devtool = 'cheap-eval-source-map';
    } else {
        config.optimization = {
            minimize: true,
            minimizer: [
                new TerserPlugin(),
                new OptimizeCSSAssetsPlugin({})
            ],
        }
    }
    if (analyze) {
        config.plugins.push(new BundleAnalyzerPlugin());
    }
    return config;
};
