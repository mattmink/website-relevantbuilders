Vue.component('icon', {
    template: '<span></span>',
    props: {
        name: {
            type: String,
            required: true,
        },
    },
    mounted() {
        const { staticClass, attrs } = this.$vnode.data;
        const div = document.createElement('div');
        div.innerHTML = feather.icons[this.name].toSvg({
            ...attrs,
            class: `icon${!staticClass ? '' : ` ${staticClass}`}`,
        });
        this.$el.replaceWith(div.firstChild);
    }
});
