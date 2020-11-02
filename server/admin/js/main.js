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

    const fetchJson = (url, config) => fetch(url, config).then((response) => {
        if (!response.ok) throw new Error(response.statusText);
        return response.json();
    });

    const isClickOutside = (event, elements, { handleKeyup = true } = {}) => {
        const {
            type,
            key,
            target,
            composedPath = () => null,
            path = composedPath.call(event),
        } = event;

        if (type !== 'click' && (!handleKeyup || key !== 'Tab')) return false;

        const containers = Array.isArray(elements) ? elements : [elements];
        const isInsideAnyContainer = containers.some((container) => {
            if (container.contains(document.activeElement)) return true;
            return (path && path.includes(container)) || container.contains(target);
        });

        return !isInsideAnyContainer;
    };

    Vue.use(VueLoading);
    Vue.use(Toasted);

    new Vue({
        el: '#app',
        data() {
            return {
                activePage: '',
                pages: [],
                imagePreviews: {},
                showPagesDropdown: false,
                showCollapseMenu: false,
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
            async publish() {
                const loading = this.loading('Publishing your changes...');
                try {
                    await fetch('/s/api/publish', {
                        method: 'POST',
                        mode: 'no-cors',
                    });
                    this.alertSuccess('Your changes have been published!');
                } catch (error) {
                    this.alertError('An error occurred while publishing your changes.');
                }
                loading.hide();
            },
            uploadImage(formData, imageId, cropData = {}) {
                const serializedCropData = Object.keys(cropData).map(key => `${key}:${cropData[key]}`).join(',');
                const loading = this.loading('Saving image...');
                return fetch(`/s/api/image/upload?imageId=${imageId}&cropData=${serializedCropData}`, {
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
                    })
                    .finally(() => {
                        loading.hide();
                    });
            },
            uploadCropped(imageId) {
                const { formData, cropper } = this.imagePreviews[imageId];
                const { x, y, width, height } = cropper.getData();
                this.uploadImage(formData, imageId, { x, y, width, height });
            },
            async handleImageChange({ files: [file], formData }, imageId) {
                const img = await getImageFromFile(file);
                const { minHeight = 0, minWidth = 0 } = this.imageRequirements[imageId];
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
            loading(message) {
                const props = !message ? null : { before: this.$createElement('h3', { class: 'text-center mb-3' }, message) };
                return this.$loading.show({ isFullPage: true }, props);
            }
        },
        watch: {
            showPagesDropdown(showPagesDropdown) {
                if (showPagesDropdown) {
                    this.clickOutsideHandler = (event) => {
                        if (isClickOutside(event, this.$refs.pagesDropdown)) {
                            this.showPagesDropdown = false;
                        }
                    };
                    document.addEventListener('click', this.clickOutsideHandler);
                } else {
                    document.removeEventListener('click', this.clickOutsideHandler);
                }
            },
            activePage() {
                this.showPagesDropdown = false;
            }
        },
        async mounted() {
            const loading = this.loading();
            try {
                const content = await fetchJson('/s/api/content');
                this.imageRequirements = { ...content.images };
                this.imagePreviews = Object.keys(content.images).reduce((obj, key) => {
                    obj[key] = null;
                    return obj;
                }, {});
                this.pages = content.pages;
                this.activePage = this.pages[0].id;
            } catch (error) {
                this.alertError('An error occurred while loading website content.');
            }
            loading.hide();
        }
    });
})();
