const {
    MAILER_HOST,
    MAILER_PORT,
    MAILER_SERVER_EMAIL,
    MAILER_SERVER_PASSWORD,
    MAILER_EMAIL_TO,
    AUTH_VALID_USERS,
    AUTH_SESSION_SECRET,
    AUTH_GOOGLE_CLIENT_ID,
    AUTH_GOOGLE_CLIENT_SECRET,
    APP_ROOT,
} = process.env;

const requiredSettings = [
    'MAILER_HOST',
    'MAILER_PORT',
    'MAILER_SERVER_EMAIL',
    'MAILER_SERVER_PASSWORD',
    'MAILER_EMAIL_TO',
    'AUTH_VALID_USERS',
    'AUTH_SESSION_SECRET',
    'AUTH_GOOGLE_CLIENT_ID',
    'AUTH_GOOGLE_CLIENT_SECRET',
    'APP_ROOT'
];
const missingSettings = requiredSettings.filter(setting => process.env[setting] === undefined);

if (missingSettings.length > 0) {
    throw new Error(`Missing required env settings: ${missingSettings.join(', ')}`);
}

module.exports = {
    appRoot: APP_ROOT,
    mailer: {
        host: MAILER_HOST,
        port: MAILER_PORT,
        serverEmailAddress: MAILER_SERVER_EMAIL,
        serverEmailPassword: MAILER_SERVER_PASSWORD,
        emailTo: MAILER_EMAIL_TO,
    },
    auth: {
        validUsers: (AUTH_VALID_USERS || '').split(','),
        sessionSecret: (AUTH_SESSION_SECRET || '').split(','),
        googleClientId: AUTH_GOOGLE_CLIENT_ID,
        googleClientSecret: AUTH_GOOGLE_CLIENT_SECRET,
    },
};
