const express = require('express');
const path = require('path');
const { glob } = require('glob');

const { readJsonSync, readFileSync } = require('fs-extra');
const { authenticate, ensureIsLoggedIn } = require('./auth.js');
const { sendMessage } = require('./controllers/mailController.js');
const { uploadImage, resizeImage, removeGalleryImage } = require('./controllers/photosController.js');
const { publish, save } = require('./controllers/contentController.js');
const { appRoot, publicRoot } = require('./config.js');
const content = readJsonSync(path.resolve(__dirname, './admin/content.json'));

const adminRoot = `${appRoot}/admin`;
const serverPath = path.resolve(__dirname);

const getHTMLById = () => content.pages.reduce((map, { id, html = [] }) => {
    if (html.length > 0) {
        return {
            ...map,
            ...html.reduce((htmlMap, htmlId) => {
                const html = readFileSync(path.join(serverPath, `./content/${htmlId}.html`), 'utf-8');
                htmlMap[htmlId] = {
                    ...content.html[htmlId],
                    html,
                };
                return htmlMap;
            }, {})
        };
    }
    return map;
}, {});

const getGalleryImagesById = () => content.pages.reduce((mapped, { gallery }) => {
    if (!gallery) return mapped;
    mapped[gallery] = glob.sync(path.join(serverPath, `./uploads/images/galleries/${gallery}/thumbs/*`))
        .map((thumbPath) => {
            const thumb = thumbPath.replace(serverPath, adminRoot);
            return {
                thumb,
                fileName: path.basename(thumb),
                full: thumb.replace(`${gallery}/thumbs`, `${gallery}/full`),
            };
        });
    return mapped;
}, {});

const router = express.Router();

const api = (route = '') => `/api${route}`;
const admin = (route = '') => `/admin${route}`;

router.post(api('/message/send'), sendMessage);

router.post(api('/image/upload'), ensureIsLoggedIn(), uploadImage, resizeImage);

router.post(api('/gallery/image/delete'), ensureIsLoggedIn(), removeGalleryImage);

router.post(api('/publish'), ensureIsLoggedIn(), publish);

router.post(api('/save'), ensureIsLoggedIn(), save);

router.get(
    api('/content'),
    ensureIsLoggedIn(),
    (req, res) => res.status(200).json({
        ...content,
        html: getHTMLById(),
        galleryImagesById: getGalleryImagesById()
    })
);

// Authentication routes
router.get(admin('/auth'), authenticate());
router.get(admin('/auth/return'), authenticate({ failureRedirect: adminRoot }), (req, res) => res.redirect(adminRoot));

router.get(admin(), (req, res) => {
    if (req.user) {
        res.render('index', { title: 'Relevant Builders Website Admin', publicRoot, content });
    } else {
        res.render('login', { title: 'Sign In: Relevant Builders Website Admin' });
    }
});

module.exports = router;
