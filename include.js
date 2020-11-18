const { readFileSync } = require('fs');
const path = require('path');

const includeRegex = /<include file=\\?"([\w-\/\.]+)\\?" ?\/?>/g;
const includeRoot = path.resolve('./public');

module.exports.injectIncludes = (str, { escapeQuotes } = {}) => str.replace(includeRegex, (_, file) => {
    let replacement = readFileSync(path.resolve(includeRoot, file), 'utf8');

    if (includeRegex.test(replacement)) {
        replacement = injectIncludes(replacement);
    }

    if (escapeQuotes) {
        replacement = replacement.replace(/"/g, '\\\"');
    }
    return replacement;
});
