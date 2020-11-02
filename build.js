// npm run build && /bin/cp -R dist/. /home/releenph/public_html/
require('dotenv').config();

const path = require('path');
const { execSync } = require('child_process');

const { deployDir } = require('./server/config');

const dist = path.resolve(__dirname, './dist');
const envVars = 'NODE_OPTIONS=--max_old_space_size=4096 NODE_ENV=production';
const buildStr = `${envVars} npx webpack --mode=production ${deployDir === dist ? '' : ` && /bin/cp -R ${dist}/. ${deployDir}`}`;
const execOptions = {
    stdio: 'inherit',
    cwd: path.resolve(__dirname),
};

const build = () => execSync(buildStr, execOptions);

module.exports = { build };
