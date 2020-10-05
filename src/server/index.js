const express = require('express');
const routes = require('./routes.js');

const app = express();
const bodyParser = require('body-parser');
const { PORT = 3000, NODE_ENV } = process.env;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.use('/api/', routes);

app.listen(PORT, () => {
    if (NODE_ENV === 'development') {
        console.log(`server running at http://localhost:${PORT}`)
    }
});
