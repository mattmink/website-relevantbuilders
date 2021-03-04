const { readFileSync } = require('fs');
const glob = require('glob');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const htmlMinifier = require('html-minifier-terser');
const feather = require('feather-icons');
const path = require('path');

const iconRegex = /<icon (?:class=\\?"([\w\s-]+)\\?" )?name=\\?"([\w-]+)\\?"(?: class=\\?"([\w\s-]+)\\?")? ?\/?>/g;
const includeRegex = /<include file=\\?"([\w-\/\.]+)\\?" ?\/?>/g;
const galleryRegex = /<gallery name=\\?"([\w-\/\.]+)\\?" ?\/?>/g;

const publicRootByMode = {
    production: path.resolve(__dirname, './public-tmp'),
    development: path.resolve(__dirname, './public'),
};
const templateMap = {};
const imageRegex = /[-_@\.\/\~\\\w\d]+\.(?:jpe?g|png|gif)/g;
const imageSrcMap = {};
const registerImage = (name, source) => {
    const [mappedName] = source.match(imageRegex) || [];
    imageSrcMap[name] = `/${mappedName}`;
};
const THUMB = 'thumb';
const FULL = 'full';
let updated = [];
let galleries = {};

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

const makeGalleryItem = ({ thumb, full }) => `<div class="gallery-item"><a href="${full}" class="gallery-thumb"><img src="${thumb}" /></a></div>`;

const injectGalleries = (str, { escapeQuotes } = {}) => str.replace(galleryRegex, (_, galleryName) => {
    const galleryImages = galleries[galleryName];

    if (!galleryImages || Object.keys(galleryImages).length === 0) return '';

    const mappedImages = Object.values(galleryImages).reduce((galleryHtml, img) => `${galleryHtml}${makeGalleryItem(img)}`, '');
    let replacement = `<div class="gallery">${mappedImages}</div>`;

    if (escapeQuotes) {
        replacement = replacement
            .replace(imageRegex, match => imageSrcMap[match])
            .replace(/"/g, '\\\"');
    }

    return replacement;
});

const injectIncludes = (str, { escapeQuotes, minify, mode = 'development' } = {}) => injectGalleries(str.replace(includeRegex, (_, file) => {
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
}), { escapeQuotes });

class TemplateBuilderPlugin {
    constructor({ mode }) {
        this.mode = mode;
    }

    apply(compiler) {
        const isDev = this.mode === 'development';
        // TODO: Find a way to refresh on change to includes from other directories
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
    const callback = this.async();
    Promise.all([
        new Promise((resolve) => {
            const galleriesRoot = path.join(publicRootByMode[this.mode], 'assets/images/galleries/');
            const galleryMatches = [...source.matchAll(galleryRegex)];
            let resolved = 0;

            const checkGalleryStatus = (imageCount, imagesResolved) => {
                if (imagesResolved >= imageCount) resolved += 1;
                if (resolved === galleryMatches.length) resolve();
            }

            galleryMatches.forEach(([, galleryName], i) => {
                const galleryImages = glob.sync(path.join(galleriesRoot, galleryName, '**/*.{jpg,jpeg,png}'));

                if (galleryImages.length === 0) {
                    resolve();
                    return;
                }

                let imagesResolved = 0;

                if (!galleries[galleryName]) galleries[galleryName] = {};
                this.addContextDependency(path.join(galleriesRoot, galleryName))

                galleryImages.forEach((file) => {
                    const fileName = path.basename(file);
                    const [,filePath] = file.split('assets/');

                    if (!galleries[galleryName][fileName]) galleries[galleryName][fileName] = { [THUMB]: '', [FULL]: '' };

                    this.loadModule(filePath, (err, source) => {
                        const thumbOrFull = filePath.includes('thumbs') ? THUMB : FULL;

                        registerImage(filePath, source);
                        galleries[galleryName][fileName][thumbOrFull] = filePath;
                        imagesResolved += 1;
                        checkGalleryStatus(galleryImages.length, imagesResolved);
                    });
                });
            });

            if (galleryMatches.length === 0) resolve();
        }),

        new Promise((resolve) => {
            const imageMatches = (source.match(imageRegex) || []);
            let resolved = 0;

            imageMatches.forEach((name, i) => {
                this.loadModule(name, (err, source) => {
                    registerImage(name, source);
                    resolved += 1;
                    if (resolved === imageMatches.length) resolve();
                });
            });

            if (imageMatches.length === 0) resolve();
        })
    ]).then(() => {
        const escapeQuotes = true;
        const content = convertIcons(injectIncludes(source, { escapeQuotes, minify: true, mode: this.mode }), { escapeQuotes });
        callback(null, content, map);
    });

};

module.exports.TemplateBuilderPlugin = TemplateBuilderPlugin;
