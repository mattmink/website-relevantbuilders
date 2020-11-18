const path = require('path');
const { lstatSync, readdirSync, readFileSync, copySync, remove } = require('fs-extra');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { TemplateBuilderPlugin } = require('./template-builder');
const WatchFilesPlugin = require('webpack-watch-files-plugin').default;
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const { injectIncludes } = require('./include');

const content = JSON.parse(readFileSync(path.resolve(__dirname, './server/admin/content.json'), 'utf8'));

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
    const publicRoot = path.resolve(__dirname, `./public${isDev ? '' : '-tmp'}`);
    const pagesRoot = path.join(publicRoot, '/pages');
    const componentsRoot = path.join(publicRoot, '/components');

    if (!isDev) {
        copySync(path.resolve('./public'), publicRoot, { recursive: true });
        copySync(path.resolve('./server/uploads/images'), path.join(publicRoot, '/assets/images'), { recursive: true });
    }

    const pages = getDirectories(pagesRoot).map((dir) => dir.replace(`${pagesRoot}/`, ''));
    const templateConfig = {
        chunksSortMode: 'manual',
        template: path.join(publicRoot, '/templates/index.html'),
        favicon: path.join(publicRoot, '/assets/favicon.ico'),
        templateParameters: {
            include: filePath => injectIncludes(readFileSync(path.join(publicRoot, '/templates', filePath), 'utf8')),
        },
    };

    const config = {
        entry: {
            common: `./public${isDev ? '' : '-tmp'}/common.js`,
            home: `./public${isDev ? '' : '-tmp'}/pages/index.js`,
            ...pages.reduce((pageEntries, page) => {
                pageEntries[page] = `./public${isDev ? '' : '-tmp'}/pages/${page}`;
                return pageEntries;
            }, {})
        },
        resolve: {
            alias: {
                icons: path.resolve(__dirname, './node_modules/feather-icons/dist/icons/'),
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
                ...content.pages.filter(({ id }) => id === 'home').map(({ title, description }) => ({ title, description })).pop(),
                chunks: ['home', 'common'],
            }),
            ...content.pages.filter(({ id }) => id !== 'home').map(({ id, title, description}) => new HtmlWebpackPlugin({
                ...templateConfig,
                title,
                description,
                filename: `${id}/index.html`,
                chunks: [id, 'common'],
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
                '/s/api': 'http://localhost:3000',
            },
        },
    };
    if (isDev) {
        config.plugins.push(
            new WatchFilesPlugin({
                files: ['./public/**/*.html'],
            })
        );
    } else {
        config.plugins.push(
            {
                apply: (compiler) => {
                    compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
                        remove(publicRoot);
                    });
                }
            }
        )
    }
    if (analyze) {
        config.plugins.push(new BundleAnalyzerPlugin());
    }
    return config;
};
