const { readFileSync } = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const htmlMinifier = require('html-minifier-terser');
const feather = require('feather-icons');
const path = require('path');

const iconRegex = /<icon (?:class=\\?"([\w\s-]+)\\?" )?name=\\?"([\w-]+)\\?"(?: class=\\?"([\w\s-]+)\\?")? ?\/?>/g;
const includeRegex = /<include file=\\?"([\w-\/\.]+)\\?" ?\/?>/g;

const publicRootByMode = {
    production: path.resolve(__dirname, './public-tmp'),
    development: path.resolve(__dirname, './public'),
};
const templateMap = {};
const imageRegex = /[-_@\.\/\~\\\w\d]+\.(?:jpe?g|png|gif)/g;
const imageSrcMap = {};
let updated = [];

const convertIcons = (str, { escapeQuotes } = {}) => str.replace(iconRegex, (_, _styleClass, name, styleClass = _styleClass) => {
    const replacement = feather.icons[name].toSvg({ class: styleClass });
    if (escapeQuotes) {
        return replacement.replace(/"/g, '\\\"');
    }
    return replacement;
});

const minifyHtml = (html = '') => htmlMinifier.minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true
});

const injectIncludes = (str, { escapeQuotes, minify, mode = 'development' } = {}) => str.replace(includeRegex, (_, file) => {
    let replacement = readFileSync(path.resolve(publicRootByMode[mode], file), 'utf8');

    if (includeRegex.test(replacement)) {
        replacement = injectIncludes(replacement);
    }

    if (minify) {
        replacement = minifyHtml(replacement);
    }

    if (escapeQuotes) {
        replacement = replacement.replace(/"/g, '\\\"');
    }

    return replacement;
});

class TemplateBuilderPlugin {
    constructor({ mode }) {
        this.mode = mode;
    }

    apply(compiler) {
        const isDev = this.mode === 'development';
        const pagesPath = path.join(publicRootByMode[this.mode], '/pages');

        const getTemplateName = (filePath) => {
            if (filePath.slice(-5) !== '.html' || filePath.indexOf(pagesPath) !== 0) return null;
            return filePath.replace(`${pagesPath}/`, '');
        };

        if (isDev) {
            compiler.hooks.watchRun.tap('TemplateBuilderPlugin', (comp) => {
                updated = Object.keys(comp.watchFileSystem.watcher.mtimes)
                    .map(getTemplateName)
                    .filter(Boolean);
            });
            compiler.hooks.afterEmit.tap('TemplateBuilderPlugin', () => {
                updated = [];
            });
        }

        compiler.hooks.compilation.tap('TemplateBuilderPlugin', (compilation) => {
            HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
                'TemplateBuilderPlugin',
                (data, cb) => {
                    const { outputName } = data;
                    let template = templateMap[outputName];

                    if (!isDev || !template || updated.includes(outputName)) {
                        template = convertIcons(injectIncludes(readFileSync(`${pagesPath}/${outputName}`, 'utf8'), { mode: this.mode }))
                            .replace(imageRegex, match => imageSrcMap[match]);
                        templateMap[outputName] = template;
                    }

                    data.html = minifyHtml(convertIcons(injectIncludes(data.html.replace(/<page ?\/>/, template), { mode: this.mode })));
                    cb(null, data);
                }
            )
        });
    }
}

module.exports = function (source, map) {
    (source.match(imageRegex) || [])
        .forEach((name) => {
            this.loadModule(name, (err, source) => {
                const [mappedName] = source.match(imageRegex) || [];
                imageSrcMap[name] = mappedName;
            });
        });
    const escapeQuotes = true;
    const content = convertIcons(injectIncludes(source, { escapeQuotes, minify: true, mode: this.mode }), { escapeQuotes });
    this.callback(null, content, map);
};

module.exports.TemplateBuilderPlugin = TemplateBuilderPlugin;
