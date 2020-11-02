const { build } = require('../../build');

let isPublishing = false;

function publish(req, res) {
    if(isPublishing) return res.status(500).send('Please wait. Publish is still in progress');

    isPublishing = true;

    try {
        build();
        res.sendStatus(200);
    } catch(e) {
        res.status(400).send(e);
    }
    isPublishing = false;
}


module.exports = { publish };
