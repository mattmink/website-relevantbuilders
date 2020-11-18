const { readFileSync } = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { minify: htmlMinify } = require('html-minifier-terser');
const feather = require('feather-icons');
const path = require('path');
const { injectIncludes } = require('./include');

const iconRegex = /<icon (?:class=\\?"([\w-]+)\\?" )?name=\\?"([\w-]+)\\?"(?: class=\\?"([\w-]+)\\?")? ?\/?>/g;
const pagesPath = path.resolve('./public/pages');
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
const getTemplateName = filePath => {
    if (filePath.slice(-5) !== '.html' || filePath.indexOf(pagesPath) !== 0) return null;
    return filePath.replace(`${pagesPath}/`, '');
}

class TemplateBuilderPlugin {
    constructor({ mode }) {
        this.mode = mode;
    }

    apply(compiler) {
        const isDev = this.mode = 'development';
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
                        template = htmlMinify(injectIncludes(readFileSync(`${pagesPath}/${outputName}`, 'utf8')), {
                            collapseWhitespace: true,
                            removeComments: true,
                            removeRedundantAttributes: true,
                            removeScriptTypeAttributes: true,
                            removeStyleLinkTypeAttributes: true,
                            useShortDoctype: true
                        }).replace(imageRegex, match => imageSrcMap[match]);
                        templateMap[outputName] = template;
                    }

                    data.html = convertIcons(data.html.replace(/<page ?\/>/, template));
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
    this.callback(null, convertIcons(injectIncludes(source, { escapeQuotes }), { escapeQuotes }), map);
};

module.exports.TemplateBuilderPlugin = TemplateBuilderPlugin;
