const path = require('path');
const multer = require('multer');
const jimp = require("jimp");
const fs = require('fs-extra');
const { appRoot } = require('../config.js');
const { images } = fs.readJsonSync(path.resolve(__dirname, '../admin/content.json'));

const uploadsDir = path.join(__dirname, '../uploads');
const uploadsImagesDir = path.join(uploadsDir, 'images');
const uploadsGalleriesDir = path.join(uploadsImagesDir, 'galleries');

fs.ensureDirSync(uploadsImagesDir);

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
const makeGalleryImage = (gallery, fileName) => {
    const galleryPath = `${appRoot}/admin/uploads/images/galleries/${gallery}`;
    return {
        fileName,
        thumb: `${galleryPath}/thumbs/${fileName}`,
        full: `${galleryPath}/full/${fileName}`,
    };
}
const getGalleryManifest = (galleryName) => fs.readJsonSync(path.join(uploadsGalleriesDir, galleryName, 'manifest.json'));
const updateGalleryManifest = (galleryName, galleryManifest) => {
    const manifestPath = path.join(uploadsGalleriesDir, galleryName, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(galleryManifest));
};

const uploadImage = (req, res, next) => {
    try {
        uploadSingle(req, res, (err) => {
            if (err) {
                console.error(err);
            }
            next();
        });
    } catch (error) {
        console.error(error)
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
            .scaleToFit(minWidth, minHeight)
            .quality(70)
            .write(`${uploadsImagesDir}/${fileName2x}`);
        croppedSmall
            .scaleToFit(minWidth / 2, minHeight / 2)
            .quality(70)
            .write(`${uploadsImagesDir}/${fileName1x}`);

        res.status(200).json([fileName2x, fileName1x]);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
};

const removeAsync = (file) => new Promise((resolve, reject) => {
    fs.remove(file, (err) => {
        if (err) reject(err);
        else resolve();
    });
});

const getId = () => `${(new Date()).getTime().toString(36)}${Math.random().toString(36).slice(2)}`;

const saveGalleryImage = async ({ file, query: { gallery } }, res) => {
    if (!file || !file.buffer) return res.sendStatus(500);

    try {
        const fileName = `${getId()}.jpg`
        const image = (await jimp.read(file.buffer));
        const width = image.getWidth();
        const height = image.getHeight();
        const isLandscape = width > height;
        const minDimension = Math.min(width, height);
        const x = isLandscape ? (width / 2) - (minDimension / 2) : 0;
        const y = isLandscape ? 0 : (height / 2) - (minDimension / 2);
        const thumb = image.clone().crop(x, y, minDimension, minDimension);
        const fullPath = path.join(uploadsGalleriesDir, gallery, 'full', fileName);
        const thumbPath = path.join(uploadsGalleriesDir, gallery, 'thumbs', fileName);

        image
            .scaleToFit(1200, 1200)
            .quality(70)
            .write(fullPath);
        thumb
            .resize(300, 300)
            .quality(70)
            .write(thumbPath);


        const galleryManifest = getGalleryManifest(gallery);
        galleryManifest.push(fileName);
        updateGalleryManifest(gallery, galleryManifest);

        res.status(200).json(makeGalleryImage(gallery, fileName));
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
};

const removeGalleryImage = async ({ body: { gallery, fileName } }, res, next) => {
    const galleryDir = path.join(uploadsImagesDir, 'galleries', gallery);
    const full = path.join(galleryDir, 'full', fileName);
    const thumb = path.join(galleryDir, 'thumbs', fileName);

    if (!fs.existsSync(full) || !fs.existsSync(thumb)) {
        res.sendStatus(204);
        return;
    }

    try {
        await Promise.all([removeAsync(full), removeAsync(thumb)]);
        const galleryManifest = getGalleryManifest(gallery);
        galleryManifest.splice(galleryManifest.indexOf(fileName), 1);
        updateGalleryManifest(gallery, galleryManifest);
        res.sendStatus(204);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
};

const sortGallery = async ({ body: { gallery, images } }, res, next) => {
    updateGalleryManifest(gallery, images);
    res.sendStatus(200);
};

module.exports = {
    sortGallery,
    makeGalleryImage,
    uploadImage,
    resizeImage,
    saveGalleryImage,
    removeGalleryImage,
};
