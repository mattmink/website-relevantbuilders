Vue.component('Modal', {
    template: '#modalTemplate',
    props: {
        headerClass: {
            type: [String, Array, Object],
            default: () => '',
        },
    },
    data() {
        return {
            isShow: false,
        }
    },
    methods: {
        handleModalClick({ target }) {
            if (target === this.$el) this.$emit('close');
        }
    },
    mounted() {
        document.body.classList.add('modal-open');
        setTimeout(() => {
            this.isShow = true;
        }, 50);
    },
    beforeDestroy() {
        document.body.classList.remove('modal-open');
    }
});
