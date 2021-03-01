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
            onClick(e, toastObject) {
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

    const captureSaveKey = (e) => {
        const { metaKey, key } = e;
        const isSaveKey = key === 's' && metaKey;

        if (!isSaveKey) return false;

        e.preventDefault();

        return true;
    };

    Vue.use(VueLoading);
    Vue.use(Toasted);
    Vue.component('Editor', Editor);

    new Vue({
        el: '#app',
        data() {
            return {
                contentHTMLOld: {},
                contentHTML: {},
                imageRequirements: {},
                activePageId: '',
                pages: [],
                imagePreviews: {},
                showPagesDropdown: false,
                showPagesDropdownInline: false,
                showCollapseMenu: false,
                hasUnsavedChanges: false,
                editorConfig: {
                    menubar: false,
                    plugins: [
                        'lists link image charmap preview anchor',
                        'searchreplace visualblocks code fullscreen',
                        'insertdatetime media paste code'
                    ],
                    toolbar:
                        'undo redo | formatselect | bold italic | link unlink | \
                        alignleft aligncenter alignright alignjustify | \
                        bullist numlist outdent indent | removeformat',
                    anchor_top: false,
                    anchor_bottom: false,
                    target_list: false,
                    link_title: false,
                    link_list: [],
                    relative_urls : false,
                    remove_script_host : true,
                    document_base_url : '',
                    setup: (editor) => {
                        editor.on('keydown', (e) => {
                            const htmlId = editor.id.replace('editor_', '');

                            if (!captureSaveKey(e) || !this.unsavedContent.includes(htmlId)) return;

                            this.save(htmlId);
                        })
                    },
                },
            };
        },
        computed: {
            isEmptyPageImages() {
                return !this.activePage.images || this.activePage.images.length === 0;
            },
            isEmptyPageHTML() {
                return !this.activePage.html || this.activePage.html.length === 0;
            },
            hasPageContent() {
                return !this.isEmptyPageImages || !this.isEmptyPageHTML;
            },
            activePage() {
                if (!this.activePageId) return { images: [] };
                return this.pages.find(({ id }) => id === this.activePageId);
            },
            notActivePages() {
                return this.pages.filter(({ id }) => id !== this.activePageId);
            },
            unsavedContent() {
                return Object.keys(this.contentHTML).filter(key => this.contentHTML[key].html !== this.contentHTMLOld[key].html);
            }
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
            async save(htmlId) {
                const loadingMessage = !htmlId ? 'Saving your changes...' : `Saving changes to ${this.contentHTML[htmlId].title}...`;
                const loading = this.loading(loadingMessage);
                const data = !htmlId ? this.contentHTML : { [htmlId]: this.contentHTML[htmlId] };
                try {
                    await fetch('/s/api/save', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data),
                    });
                    if (htmlId) {
                        this.contentHTMLOld[htmlId] = JSON.parse(JSON.stringify(data[htmlId]));
                    } else {
                        this.contentHTMLOld = JSON.parse(JSON.stringify(data));
                    }

                    const successMessage = !htmlId ? 'Your changes have been saved!' : `${this.contentHTML[htmlId].title} has been updated!`;
                    this.alertSuccess(successMessage);
                } catch (error) {
                    this.alertError('An error occurred while saving your changes.');
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
            },
        },
        watch: {
            showCollapseMenu(showCollapseMenu) {
                const closingClass = 'mobile-menu-closing';
                const body = document.body;
                const bodyClassList = body.classList;

                if (!showCollapseMenu) {
                    if (!this.onMenuClosed) {
                        this.onMenuClosed = () => {
                            bodyClassList.remove(closingClass);
                            body.removeEventListener('transitionend', this.onMenuClosed);
                        };
                    }
                    body.addEventListener('transitionend', this.onMenuClosed);
                } else {
                    body.removeEventListener('transitionend', this.onMenuClosed);
                    bodyClassList.remove(closingClass);
                }

                bodyClassList.toggle('mobile-menu-open');
            },
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
            showPagesDropdownInline(showPagesDropdownInline) {
                if (showPagesDropdownInline) {
                    this.clickOutsideHandlerInline = (event) => {
                        if (isClickOutside(event, this.$refs.pagesDropdownInline)) {
                            this.showPagesDropdownInline = false;
                        }
                    };
                    document.addEventListener('click', this.clickOutsideHandlerInline);
                } else {
                    document.removeEventListener('click', this.clickOutsideHandlerInline);
                }
            },
            activePageId() {
                this.showPagesDropdown = false;
                this.showPagesDropdownInline = false;
            },
        },
        async mounted() {
            const loading = this.loading();
            try {
                const content = await fetchJson('/s/api/content');
                this.imageRequirements = { ...content.images };
                this.contentHTMLOld = JSON.parse(JSON.stringify(content.html));
                this.contentHTML = { ...content.html };
                this.imagePreviews = Object.keys(content.images).reduce((obj, key) => {
                    obj[key] = null;
                    return obj;
                }, {});
                this.pages = content.pages;
                this.activePageId = this.pages[0].id;
                this.editorConfig.link_list = content.pages.map(({ name, path }) => ({ title: name, value: path }));
            } catch (error) {
                this.alertError('An error occurred while loading website content.');
            }
            document.addEventListener('keydown', (e) => {
                if (!captureSaveKey(e) || this.unsavedContent.length === 0) return;
                this.save();
            });
            loading.hide();
        }
    });
})();
