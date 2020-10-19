const path = require('path');

const camelCase = str => str.split('-')
    .reduce((converted, part, index) => `${converted}${index === 0 ? part : `${part[0].toUpperCase()}${part.slice(1)}`}`, '')

module.exports = function (source, map) {
    const icon = this.resource.split('/').pop().split('.svg').shift();
    this.callback(null, source.replace(/var code = (.*class=\\?")(.*;)/, `var code = function ${camelCase(`icon-${icon}`)}(options) {
        return $1" + (options && options.class ? options.class + ' ' : '') + "$2
    };`), map);
};
