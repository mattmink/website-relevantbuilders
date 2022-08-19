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

    const camelize = text => text
        .trim()
        .split(/\W/)
        .map((part, i) => (i === 0 ? part.toLowerCase() : `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`))
        .join('');

    const formatLinkDialog = () => {
        const dialog = document.querySelector('.tox-dialog');
        const form = dialog.querySelector('.tox-form');
        const formGroupsById = Array.from(dialog.querySelectorAll('.tox-form__group'))
            .reduce((mapped, formGroup) => {
                const label = formGroup.querySelector('.tox-label');
                const id = camelize(label.innerText);
                mapped[id] = { formGroup, label };
                return mapped;
            }, {});
        const linkListHelp = document.createElement('div');
        const urlHelp = document.createElement('div');

        linkListHelp.innerHTML = 'or <a href="#">use a custom URL</a> instead';
        urlHelp.innerHTML = 'or <a href="#">select a page from your site</a> instead';

        linkListHelp.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            formGroupsById.url.formGroup.style.display = 'block';
            formGroupsById.linkList.formGroup.style.display = 'none';
            formGroupsById.url.formGroup.querySelector('.tox-textfield').focus();
        });
        urlHelp.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            formGroupsById.url.formGroup.style.display = 'none';
            formGroupsById.linkList.formGroup.style.display = 'block';
            formGroupsById.linkList.formGroup.querySelector('button.tox-listbox').click();
        });

        dialog.classList.add('link-dialog');
        form.appendChild(formGroupsById.url.formGroup);
        formGroupsById.linkList.formGroup.appendChild(linkListHelp);
        formGroupsById.linkList.label.innerText = 'Select a Page';
        formGroupsById.url.formGroup.appendChild(urlHelp);
        formGroupsById.url.formGroup.style.display = 'none';
    };

    new Vue({
        el: '#app',
        data() {
            return {
                galleryImageForRemove: null,
                galleryImagesById: {},
                contentHTMLOld: {},
                contentHTML: {},
                testimonials: [],
                hasUnsavedTestimonials: false,
                imageRequirements: {},
                activePageId: '',
                pages: [],
                imagePreviews: {},
                showPagesDropdown: false,
                showPagesDropdownInline: false,
                showCollapseMenu: false,
                editorConfig: {
                    menubar: false,
                    plugins: [
                        'lists link image charmap preview anchor',
                        'searchreplace visualblocks code fullscreen',
                        'insertdatetime media paste code'
                    ],
                    toolbar:
                        'undo redo | formatselect | bold italic | link unlink | \
                        bullist numlist outdent indent | removeformat',
                    anchor_top: false,
                    anchor_bottom: false,
                    target_list: false,
                    link_title: false,
                    link_list: [{ title: 'Contact Us', value: '#contact' }],
                    relative_urls: false,
                    remove_script_host: true,
                    document_base_url: '',
                    setup: (editor, ...args) => {
                        editor.on('keydown', (e) => {
                            const htmlId = editor.id.replace('editor_', '');

                            if (!captureSaveKey(e) || !this.unsavedContent.includes(htmlId)) return;

                            this.save(htmlId);
                        });

                        editor.on('OpenWindow', ({ dialog }) => {
                            const data = dialog.getData();
                            if (data.url === undefined) return;
                            formatLinkDialog();
                        });
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
                return this.activePageId === 'testimonials' || !this.isEmptyPageImages || !this.isEmptyPageHTML;
            },
            activePage() {
                if (!this.activePageId) return { images: [] };
                if (this.activePageId === 'testimonials') {
                    return {
                        id: 'testimonials',
                        images: [],
                        name: 'Testimonials',
                        path: '/testimonials',
                    };
                }
                return this.pages.find(({ id }) => id === this.activePageId);
            },
            notActivePages() {
                return this.pages.filter(({ id }) => id !== this.activePageId);
            },
            unsavedContent() {
                return Object.keys(this.contentHTML).filter(key => this.contentHTML[key].html !== this.contentHTMLOld[key].html);
            },
        },
        methods: {
            goToTestimonials() {
                this.activePageId = 'testimonials';
            },
            addTestimonial() {
                this.testimonials.push({ name: '', location: '', quote: '' });
            },
            deleteTestimonial(index) {
                this.testimonials.splice(index, 1);
            },
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
            async saveTestimonials() {
                const loading = this.loading('Saving testimonials...');
                try {
                    await fetch('/s/api/saveTestimonials', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(this.testimonials),
                    });
                    this.alertSuccess('Testimonials have been saved!');
                } catch (error) {
                    this.alertError('An error occurred while saving testimonials.');
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
                        refreshImage(this.$refs[imageId][0]);
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
            async uploadGalleryImage({ formData }, gallery) {
                const loading = this.loading(`Uploading ${gallery} gallery image...`);
                return fetch(`/s/api/gallery/image/upload?gallery=${gallery}`, {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors',
                })
                    .then(async (response) => {
                        if (!response.ok) {
                            throw Error(response.statusText);
                        }
                        this.galleryImagesById[gallery].push(await response.json());
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

                const canvas = this.$refs[`${imageId}-preview`][0];
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
            confirmRemoveGalleryImage(galleryImage) {
                this.galleryImageForRemove = galleryImage;
            },
            removeGalleryImage({ fileName }) {
                const { gallery } = this.activePage;
                const loading = this.loading('Removing gallery image...');
                const index = this.galleryImagesById[gallery].findIndex(item => item.fileName === fileName);

                this.galleryImageForRemove = null;

                return fetch('/s/api/gallery/image/delete', {
                    method: 'POST',
                    body: JSON.stringify({ gallery, fileName }),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw Error(response.statusText);
                        }
                        this.galleryImagesById[gallery].splice(index, 1);
                        this.alertSuccess('The gallery image was successfully removed.');
                    })
                    .catch(() => {
                        this.alertError('An error occurred while removing the gallery image. Please try again.');
                    })
                    .finally(() => {
                        loading.hide();
                    });
            },
            handleGalleryDragover(event, galleryImage) {
                const gallery = this.galleryImagesById[this.activePage.gallery];
                const index = gallery.indexOf(galleryImage);
                const { index: draggingIndex } = this.dragging;

                if (index === draggingIndex) return;

                const { layerX, target: { offsetWidth } } = event;
                const percentX = layerX / offsetWidth;
                const isJustToTheLeft = index === draggingIndex - 1 && percentX >= .5;
                const isJustToTheRight = index === draggingIndex + 1 && percentX < .5;

                if (isJustToTheLeft || isJustToTheRight) return;

                gallery.splice(index, 0, gallery.splice(draggingIndex, 1)[0]);

                this.dragging.index = index;
            },
            handleGalleryDragstart(event, galleryImage) {
                const index = this.galleryImagesById[this.activePage.gallery].indexOf(galleryImage);
                this.dragging = { event, galleryImage, index };
                event.target.classList.add('dragging');
            },
            handleGalleryDragend() {
                this.dragging.event.target.classList.remove('dragging');
                this.dragging = null;
                const gallery = this.activePage.gallery;
                const images = this.galleryImagesById[gallery].map(({ fileName }) => fileName);
                const loading = this.loading('Updating gallery sort order...');

                fetch('/s/api/gallery/sort', {
                    method: 'POST',
                    body: JSON.stringify({ gallery, images }),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw Error(response.statusText);
                        }
                        this.alertSuccess('The gallery sort order was updated successfully.');
                    })
                    .catch(() => {
                        this.alertError('An error occurred while updating the gallery sort order. Please refresh the page and try again.');
                    })
                    .finally(() => {
                        loading.hide();
                    });
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
            testimonials: {
                deep: true,
                handler() {
                    this.hasUnsavedTestimonials = true;
                }
            }
        },
        async mounted() {
            const loading = this.loading();
            try {
                const content = await fetchJson('/s/api/content');
                this.imageRequirements = { ...content.images };
                this.contentHTMLOld = JSON.parse(JSON.stringify(content.html));
                this.contentHTML = { ...content.html };
                this.testimonials = [...content.testimonials];
                this.galleryImagesById = content.galleryImagesById;
                this.imagePreviews = Object.keys(content.images).reduce((obj, key) => {
                    obj[key] = null;
                    return obj;
                }, {});
                this.pages = content.pages.filter(({ gallery, images, html }) => images.length > 0 || html.length > 0 || !!gallery);
                this.activePageId = this.pages[0].id;
                this.editorConfig.link_list.push(...this.pages.map(({ name, path }) => ({ title: name, value: path })));
                await this.$nextTick();
                this.hasUnsavedTestimonials = false;
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
