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

const sendMessage = (req, res) => {
    const { email: replyTo, name } = req.body;

    const message = {
        from: serverEmailAddress,
        to: emailTo,
        replyTo,
        subject: 'RelevantBuilders.com Inquiry',
        html: `${name} would like to speak to you`,
    };

    transporter
        .sendMail(message)
        .then(() => {
            return res
                .status(200)
                .json({ msg: "you should receive an email from us" });
        })
        .catch((error = {}) => {
            const { response = 'An unknown error occurred', responseCode = 500 } = error;
            res.status(responseCode).send(response);
            console.error(error);
        });


};

module.exports = { sendMessage };
