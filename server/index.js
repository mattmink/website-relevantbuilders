require('dotenv').config();

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const { copySync } = require('fs-extra');
const { glob } = require('glob');

const auth = require('./auth');
const routes = require('./routes');
const { ensureIsLoggedIn } = require('./auth');
const { appRoot } = require('./config');

const app = express();
const { PORT } = process.env;

const galleriesPath = path.resolve(__dirname, './uploads/images/galleries');
const galleries = glob.sync(path.join(galleriesPath, '*'));
const getGalleryNameFromPath = (filePath) => {
    if (!filePath.includes(galleriesPath) || filePath === galleriesPath) return null;
    return filePath.slice(galleriesPath.length + 1).split('/').shift();
}
const galleryNames = galleries.map(getGalleryNameFromPath)

copySync(path.resolve(__dirname, '../public/assets/images'), path.resolve(__dirname, './uploads/images'), {
    recursive: true,
    overwrite: false,
    filter(src, dest) {
        const ignores = ['.DS_Store'];

        if (ignores.some(ignore => src.indexOf(ignore) !== -1)) return false;

        const galleryName = getGalleryNameFromPath(dest);
        return !galleryName || !galleryNames.includes(galleryName);
    },
});
copySync(path.resolve(__dirname, '../public/content'), path.resolve(__dirname, './content'), { recursive: true, overwrite: false });

app.use(require('cookie-parser')());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Views (for admin UI)
app.set('views', path.resolve(__dirname, './admin/views'));
app.set('view engine', 'pug');

// Set up auth
auth.init(app);

// Routes
app.use('/s', routes);

// Static files
app.use('/favicon.ico', express.static(path.join(__dirname, '/admin/img/favicon.ico')));
app.use('/s/admin/css', express.static(path.join(__dirname, '/admin/css')));
app.use('/s/admin/img', express.static(path.join(__dirname, '/admin/img')));
app.use('/s/admin/js', ensureIsLoggedIn(), express.static(path.join(__dirname, '/admin/js')));
app.use('/s/admin/uploads', ensureIsLoggedIn(), express.static(path.join(__dirname, './uploads')));
app.use('/s/admin/vendor/vue', express.static(path.resolve(__dirname, '../node_modules/vue/dist')));
app.use('/s/admin/vendor/cropperjs', express.static(path.resolve(__dirname, '../node_modules/cropperjs/dist')));
app.use('/s/admin/vendor/feather-icons', express.static(path.resolve(__dirname, '../node_modules/feather-icons/dist')));
app.use('/s/admin/vendor/bootstrap', express.static(path.resolve(__dirname, '../node_modules/bootstrap/dist/css')));
app.use('/s/admin/vendor/vue-toasted', express.static(path.resolve(__dirname, '../node_modules/vue-toasted/dist')));
app.use('/s/admin/vendor/vue-loading', express.static(path.resolve(__dirname, '../node_modules/vue-loading-overlay/dist')));
app.use('/s/admin/vendor/vue-tinymce', express.static(path.resolve(__dirname, '../node_modules/@tinymce/tinymce-vue/lib/browser')));

// Logging
app.use(require('morgan')('combined'));

// Start the server
app.listen(PORT, () => {
    console.log(`server running at ${appRoot}\n`);
    console.group();
    console.log(`Admin: ${appRoot}/admin`);
    console.log(`API: ${appRoot}/api`);
    console.groupEnd();
});
