const { exec } = require("child_process");
const path = require('path');

const publish = (req, res) => {
    const cdPath = path.resolve(__dirname, '../../');
    exec(`cd ${cdPath} && npm run build`, (err, stdout, stderr) => {
        if (err) return res.status(500).send(stderr);
        res.sendStatus(200);
    });
};

module.exports = { publish };
