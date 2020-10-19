const path = require('path');
const iconsPath = path.resolve(__dirname, './node_modules/feather-icons/dist/icons/');

const camelCase = str => str.split('-')
    .reduce((converted, part, index) => `${converted}${index === 0 ? part : `${part[0].toUpperCase()}${part.slice(1)}`}`, '')

module.exports = function (source, map) {
    const icon = this.resource.replace(`${iconsPath}/`, '').replace('.svg', '');
    this.callback(null, source.replace(/var code = (.*class=\\?")(.*;)/, `var code = function ${camelCase(`icon-${icon}`)}(options) {
        return $1" + (options && options.class ? options.class + ' ' : '') + "$2
    };`), map);
};
