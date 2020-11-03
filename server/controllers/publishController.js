const { build } = require('../../build');

let isPublishing = false;

function publish(req, res) {
    if(isPublishing) return res.status(500).send('Please wait. Publish is still in progress');

    isPublishing = true;

    try {
        build();
        res.sendStatus(200);
    } catch(error) {
        console.error(error);
        res.status(400).send(error);
    }
    isPublishing = false;
}


module.exports = { publish };
