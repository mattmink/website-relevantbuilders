const path = require('path');
const { writeFileSync, existsSync } = require('fs-extra');
const { build } = require('../../build');

let isPublishing = false;
let isSaving = false;
let isSavingTestimonials = false;

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

async function saveTestimonials(req, res) {
    if(isSavingTestimonials) return res.status(500).send('Please wait. Save is still in progress');

    isSavingTestimonials = true;

    try {
        writeFileSync(path.resolve(__dirname, '../content/testimonials.json'), JSON.stringify(req.body), { encoding: 'utf-8' });
        console.log(req.body);
        // Object.entries(req.body).forEach(([htmlId, { html }]) => {
        //     console.log({ htmlId, html });
        //     const filePath = path.resolve(__dirname, `../content/${htmlId}.html`);
        //     if (existsSync(filePath)) {
        //     }
        // });
        res.sendStatus(200);
    } catch(error) {
        console.error(error);
        res.status(400).send(error);
    }
    isSavingTestimonials = false;
}

module.exports = { publish, save, saveTestimonials };
