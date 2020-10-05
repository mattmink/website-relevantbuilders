const nodemailer = require("nodemailer");

const {
    host,
    port,
    serverEmailAddress,
    serverEmailPassword,
    emailTo
} = require("../config").mailer;

const transporter = nodemailer.createTransport({
    host,
    port,
    auth: {
        user: serverEmailAddress,
        pass: serverEmailPassword,
    },
});
const isAjaxRequest = req => req.xhr || req.headers.accept.indexOf('json') > -1;

const sendMessage = (req, res) => {
    const { email: replyTo, name } = req.body;
    const { origin } = new URL(req.get('Referrer'));

    const message = {
        from: serverEmailAddress,
        to: emailTo,
        replyTo,
        subject: 'RelevantBuilders.com Inquiry',
        html: `${name} would like to speak to you`,
    };

    transporter
        .sendMail(message)
        .then(() => (isAjaxRequest(req) ? res.sendStatus(200) : res.redirect(`${origin}/thank-you`)))
        .catch((error = {}) => {
            const { response = 'An unknown error occurred while sending your message', responseCode = 500 } = error;
            res.status(responseCode).send(response);
            console.error(error);
        });
};

module.exports = { sendMessage };
