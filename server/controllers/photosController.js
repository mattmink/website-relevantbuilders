const path = require('path');
const multer = require('multer');
const jimp = require("jimp");
const fs = require('fs-extra');
const { images } = fs.readJsonSync(path.resolve(__dirname, '../admin/content.json'));

const uploadsDir = path.join(__dirname, '../uploads');
const uploadsImagesDir = path.join(uploadsDir, 'images');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(uploadsImagesDir)) fs.mkdirSync(uploadsImagesDir);

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    } else {
        cb("Please upload only images.", false);
    }
};
const upload = multer({ storage, fileFilter });
const uploadSingle = upload.single('file');
const trim = (str = '') => str.trim();
const cropKeys = {
    x: 'left',
    y: 'top',
    width: 'width',
    height: 'height',
};

const uploadImage = (req, res, next) => {
    try {
        uploadSingle(req, res, (err) => {
            if (err) {
                console.log(err);
            }
            next();
        });
    } catch (error) {
        res.sendStatus(500);
    }
}

const resizeImage = async ({ file, query: { imageId, cropData } }, res, next) => {
    if (!file || !file.buffer) return res.sendStatus(500);

    try {
        const crop = cropData.split(',')
            .map(part => trim(part).split(':').map(trim))
            .reduce((obj, [key, value]) => {
                obj[cropKeys[key]] = Math.max(0, Number.parseInt(value));
                return obj;
            }, {});
        const { minWidth, minHeight } = images[imageId];

        const cropped = (await jimp.read(file.buffer)).crop(...Object.values(crop));
        const croppedSmall = cropped.clone();
        const fileName2x = `${imageId}@2x.jpg`;
        const fileName1x = `${imageId}.jpg`;

        cropped
            .resize(minWidth, minHeight)
            .quality(70)
            .write(`${uploadsImagesDir}/${fileName2x}`);
        croppedSmall
            .resize(minWidth / 2, minHeight / 2)
            .quality(70)
            .write(`${uploadsImagesDir}/${fileName1x}`);

        res.status(200).json([fileName2x, fileName1x]);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = {
    uploadImage,
    resizeImage,
};
