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

    new Vue({
        el: '#app',
        methods: {
            uploadImage({ formData }, imageId) {
                fetch(`/api/image/upload?imageId=${imageId}`, {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors',
                })
                    .then(() => {
                        refreshImage(this.$refs[imageId]);
                    })
                    .catch(console.error);
            },
        }
    });
})();
