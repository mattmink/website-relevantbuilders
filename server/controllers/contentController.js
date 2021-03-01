const path = require('path');
const { writeFileSync, existsSync } = require('fs-extra');
const { build } = require('../../build');

let isPublishing = false;
let isSaving = false;

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

async function save(req, res) {
    if(isSaving) return res.status(500).send('Please wait. Save is still in progress');

    isSaving = true;

    try {
        Object.entries(req.body).forEach(([htmlId, { html }]) => {
            console.log({ htmlId, html });
            const filePath = path.resolve(__dirname, `../content/${htmlId}.html`);
            if (existsSync(filePath)) {
                writeFileSync(filePath, html, { encoding: 'utf-8' });
            }
        });
        res.sendStatus(200);
    } catch(error) {
        console.error(error);
        res.status(400).send(error);
    }
    isSaving = false;
}

module.exports = { publish, save };
