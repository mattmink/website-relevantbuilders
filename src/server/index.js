const express = require('express');
const routes = require('./routes.js');

const app = express();
const bodyParser = require('body-parser');
const { PORT } = process.env;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.use('/api/', routes);

app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`);
});
