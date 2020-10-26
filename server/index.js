require('dotenv').config();

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const { copySync } = require('fs-extra');

const auth = require('./auth');
const routes = require('./routes');
const { ensureIsLoggedIn } = require('./auth');

const app = express();
const { PORT } = process.env;

copySync(path.resolve(__dirname, '../public/assets/images'), path.resolve(__dirname, './uploads/images'), { recursive: true, overwrite: false });

// Middleware
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Views (for admin UI)
app.set('views', path.resolve(__dirname, './admin/views'));
app.set('view engine', 'pug');

// Set up auth
auth.init(app);

// Routes
app.use('/', routes);

// Static files
app.use(express.static(path.join(__dirname, '../dist')));
app.use('/admin/css', express.static(path.join(__dirname, '/admin/css')));
app.use('/admin/img', express.static(path.join(__dirname, '/admin/img')));
app.use('/admin/js', ensureIsLoggedIn(), express.static(path.join(__dirname, '/admin/js')));
app.use('/admin/uploads', ensureIsLoggedIn(), express.static(path.join(__dirname, './uploads')));
app.use('/admin/vendor/vue', express.static(path.resolve(__dirname, '../node_modules/vue/dist')));
app.use('/admin/vendor/cropperjs', express.static(path.resolve(__dirname, '../node_modules/cropperjs/dist')));
app.use('/admin/vendor/feather-icons', express.static(path.resolve(__dirname, '../node_modules/feather-icons/dist')));
app.use('/admin/vendor/bootstrap', express.static(path.resolve(__dirname, '../node_modules/bootstrap/dist/css')));

// Start the server
app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`);
});
