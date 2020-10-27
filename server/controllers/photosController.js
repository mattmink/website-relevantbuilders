const path = require('path');
const multer = require('multer');
const sharp = require("sharp");
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
                obj[cropKeys[key]] = Number.parseInt(value);
                return obj;
            }, {});
        const { minWidth, minHeight } = images[imageId];
        const cropped = sharp(file.buffer)
                .extract(crop)
                .resize(minWidth, minHeight);

        const imageData = await Promise.all([
            cropped
                .jpeg({ quality: 70 })
                .toFile(`${uploadsImagesDir}/${imageId}@2x.jpg`),
            cropped
                .resize(minWidth / 2, minHeight / 2)
                .jpeg({ quality: 70 })
                .toFile(`${uploadsImagesDir}/${imageId}.jpg`)
        ])
        res.status(200).json(imageData);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = {
    uploadImage,
    resizeImage,
};
