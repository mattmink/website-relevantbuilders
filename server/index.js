require('dotenv').config();

const path = require('path');
const express = require('express');
const routes = require('./routes.js');

const app = express();
const bodyParser = require('body-parser');
const { PORT } = process.env;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

global.testing = 'testing';

app.set('views', path.resolve(__dirname, './admin/views'));
app.set('view engine', 'pug');

app.use('/', routes);

app.use(express.static(path.join(__dirname, '../dist')));
app.use('/admin/css', express.static(path.join(__dirname, '/admin/css')));
app.use('/admin/js', express.static(path.join(__dirname, '/admin/js')));
app.use('/admin/vendor/vue', express.static(path.resolve(__dirname, '../node_modules/vue/dist')));
app.use('/admin/vendor/feather-icons', express.static(path.resolve(__dirname, '../node_modules/feather-icons/dist')));
app.use('/admin/vendor/bootstrap', express.static(path.resolve(__dirname, '../node_modules/bootstrap/dist/css')));

app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`);
});
