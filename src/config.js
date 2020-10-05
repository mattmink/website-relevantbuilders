const {
    MAILER_HOST,
    MAILER_PORT,
    MAILER_SERVER_EMAIL,
    MAILER_SERVER_PASSWORD,
    MAILER_EMAIL_TO,
} = process.env;

module.exports = {
    mailer: {
        host: MAILER_HOST,
        port: MAILER_PORT,
        serverEmailAddress: MAILER_SERVER_EMAIL,
        serverEmailPassword: MAILER_SERVER_PASSWORD,
        emailTo: MAILER_EMAIL_TO,
    },
};
