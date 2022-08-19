Vue.component('file-upload', {
    template: '#fileUploadTemplate',
    props: {
        name: {
            type: String,
            required: true,
        },
        accept: {
            type: String,
            default: null
        },
        multiple: {
            type: Boolean,
            default: false
        },
        disabled: {
            type: Boolean,
            default: false
        },
        description: {
            type: String,
            default: null
        },
        buttonText: {
            type: String,
            default: 'Browse Files'
        },
        compact: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            isDropboxActive: false
        };
    },
    computed: {
        descriptionComputed() {
            if (this.description) {
                return this.description;
            }
            return this.multiple ? 'Drop files here to upload' : 'Drop a file here to upload';
        }
    },
    methods: {
        async handleFilesChange($event) {
            const { target: { files } } = $event;

            if (files.length < 1) {
                return;
            }
            const formData = new FormData();
            this.files = Array.from(files);
            this.files.forEach((file) => {
                formData.append(this.name, file, file.name);
            });
            this.$emit('change', {
                formData,
                files: this.files,
                originalEvent: $event
            });
            this.reset();
        },
        reset() {
            this.$refs.input.value = '';
        }
    }
});
