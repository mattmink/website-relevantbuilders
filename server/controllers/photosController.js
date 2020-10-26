const path = require('path');
const multer = require('multer');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../uploads');
const uploadsImagesDir = path.join(uploadsDir, 'images');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(uploadsImagesDir)) fs.mkdirSync(uploadsImagesDir);

const storage = multer.diskStorage({
    destination: uploadsImagesDir,
    filename(req, file, cb) {
        cb(null, `${req.query.imageId}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });
const uploadSingle = upload.single('file');

const uploadImage = (req, res) => {
    try {
        uploadSingle(req, res, (err) => {
            console.log(err);
        });
        res.sendStatus(200);
    } catch (error) {
        res.sendStatus(500);
    }
}

module.exports = {
    uploadImage
};
