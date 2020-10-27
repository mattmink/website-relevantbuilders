(() => {
    const appendDateQuery = urlStr => `${(new URL(`${location.origin}${urlStr.replace(location.origin, '')}`)).pathname}?d=${Date.now()}`;

    const refreshImage = (img) => {
        const { src, srcset } = img;
        img.src = appendDateQuery(src);
        img.srcset = srcset
            .split(',')
            .map((str) => {
                const [srcsetSrc, resolution] = str.trim().split(' ');
                return `${appendDateQuery(srcsetSrc)}${!resolution ? '' : ` ${resolution}`}`;
            })
            .join(', ');
    }

    const getImageFromFile = async file => new Promise((resolve, reject) => {
        const img = document.createElement('img');
        img.addEventListener('load', () => {
            window.URL.revokeObjectURL(img.src);
            resolve(img);
        });
        img.src = window.URL.createObjectURL(file);
    });

    // TODO: Get these from the content.json file somehow
    const imageRequirements = {
        'home-main': {
            minWidth: 1200,
            minHeight: 800,
        },
    };

    const toastConfig = {
        position: 'top-left',
        duration: 5000,
        action: {
            text: 'CLOSE',
            onClick(e, toastObject){
                toastObject.goAway(0);
            }
        },
    };

    Vue.use(Toasted);

    new Vue({
        el: '#app',
        data() {
            return {
                imagePreviews: {
                    'home-main': null
                },
            };
        },
        methods: {
            closeImageUpload(imageId) {
                const { cropper } = this.imagePreviews[imageId];
                if (cropper) {
                    cropper.destroy();
                }
                this.imagePreviews[imageId] = null;
            },
            uploadImage(formData, imageId, cropData = {}) {
                const serializedCropData = Object.keys(cropData).map(key => `${key}:${cropData[key]}`).join(',');
                return fetch(`/api/image/upload?imageId=${imageId}&cropData=${serializedCropData}`, {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors',
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw Error(response.statusText);
                        }
                        refreshImage(this.$refs[imageId]);
                        this.closeImageUpload(imageId);
                        this.alertSuccess('The image was updated successfully. You will need to publish your changes');
                    })
                    .catch(() => {
                        this.alertError('An error occurred while uploading the image. Please try again.');
                    });
            },
            uploadCropped(imageId) {
                const { formData, cropper } = this.imagePreviews[imageId];
                const { x, y, width, height } = cropper.getData();
                this.uploadImage(formData, imageId, { x, y, width, height });
            },
            async handleImageChange({ files: [file], formData }, imageId) {
                const img = await getImageFromFile(file);
                const { minHeight = 0, minWidth = 0 } = imageRequirements[imageId];
                const { height, width } = img;

                if (height < minHeight || width < minWidth) {
                    this.alertError(`Your image needs to be at least ${minWidth}px wide and ${minHeight}px tall.`)
                    return;
                }

                if (height === minHeight && width === minWidth) {
                    this.uploadImage(formData, imageId);
                    return;
                }

                this.imagePreviews[imageId] = {
                    img,
                    formData,
                    cropper: null,
                };

                await this.$nextTick();

                const canvas = this.$refs[`${imageId}-preview`];
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0);

                const cropper = new Cropper(canvas, {
                    aspectRatio: minWidth / minHeight,
                    autoCropArea: 1,
                    zoomable: false,
                    minCropBoxHeight: (canvas.clientWidth / width) * minWidth,
                    minCropBoxWidth: (canvas.clientHeight / height) * minHeight,
                });

                this.$set(this.imagePreviews[imageId], 'cropper', cropper);
            },
            alertSuccess(message) {
                this.$toasted.show(message, {
                    ...toastConfig,
                    className: 'success',
                });
            },
            alertError(message) {
                this.$toasted.show(message, {
                    ...toastConfig,
                    className: 'error',
                });
            },
        },
    });
})();
