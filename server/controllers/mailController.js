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
const emailRegex = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
const usPhoneRegex = /^(?:\+(?=1)){0,1}(1[ -]|1){0,1}(?:\((?=\d{3}\))[2-9](?!11)\d{2}\)|[2-9](?!11)\d{2})[ -]{0,1}[2-9](?!11)\d{2}[ -]{0,1}\d{4}$/;

const sendMessage = (req, res) => {
    // email is not used. It's a hidden honeypot field to catch most spam
    const { name, contactInfo, location, description, email  } = req.body;
    const { origin } = new URL(req.get('Referrer'));
    const handleSuccess = () => {
        if (isAjaxRequest(req)) {
            return res.status(200).json({
                body: req.responseObject,
                success: true,
                status: req.responseStatus || 200,
            });
        }
        return res.redirect(`${origin}/thank-you`);
    };

    // This is likely spam, since email is the hidden honepot field. Simply return a 200.
    if (!!email) {
        handleSuccess();
        return;
    }

    const contactInfoParts = contactInfo.split(/([,\/:]|(?<!\(\d{3}\)) )/).map(part => part.trim());
    const replyTo = contactInfoParts.find(part => emailRegex.test(part));
    const phone = contactInfoParts.find(part => usPhoneRegex.test(part));
    const cleanPhone = !phone ? '' : phone.replace(/[^\d]/g, '');
    const formattedPhone = !phone ? '' : cleanPhone.slice(-10).replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');

    const message = {
        from: `${name} <${serverEmailAddress}>`,
        to: emailTo,
        replyTo,
        subject: 'RelevantBuilders.com Inquiry',
        html: `<html>
            <head>
                <style>
                    svg.icon {
                        display: inline-block;
                        vertical-align: middle;
                        margin-right: 5px;
                    }
                    p, table {
                        font-family: Arial, sans-serif;
                    }
                    table {
                        border-collapse: collapse;
                    }
                    th {
                        background-color: #ddd;
                        font-weight: bold;
                    }
                    th, td {
                        border: 1px solid #ccc;
                        padding: .5rem;
                        text-align: left;
                        vertical-align: top;
                    }
                    .quick-links {
                        display: block !important;
                    }
                </style>
            </head>
            <body>
                <div style="font-size: 1.25rem;">
                    <p>Hello Nate and Emily!</p>
                    <p>My name is <strong>${name}</strong>, and I'd like to talk to you about your home construction services.</p>
                    <p>Here's my information:</p>
                </div>
                <table>
                    <tbody>
                        <tr>
                            <th>Name</th>
                            <td>${name}</td>
                        </tr>
                        <tr>
                            <th>Contact Info</th>
                            <td>${contactInfo}</td>
                        </tr>
                        <tr>
                            <th>Location</th>
                            <td>${location}</td>
                        </tr>
                        ${!description ? '' : `
                        <tr>
                            <th>Project Description</th>
                            <td>${description}</td>
                        </tr>
                        `}
                    </tbody>
                </table>
                ${!replyTo && !phone ? '' : `
                <p class="quick-links" style="font-size: 1.5rem ;display: none;">
                    ${!replyTo ? '' : `
                    <a href="mailto:${replyTo}" style="margin-right: 1rem;">
                        <svg xmlns="http://www.w3.org/2000/svg"
                                class="icon"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>Send email</a>
                    `}
                    ${!phone ? '' : `
                    <a href="tel:${cleanPhone}">
                        <svg xmlns="http://www.w3.org/2000/svg"
                                class="icon"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round">
                            <polyline points="23 7 23 1 17 1" />
                            <line x1="16" y1="8" x2="23" y2="1" />
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>Call ${formattedPhone}</a>
                    `}
                </p>
                `}
            </body>
        </html>`,
    };

    transporter
        .sendMail(message)
        .then(() => handleSuccess())
        .catch((error = {}) => {
            const { response = 'An unknown error occurred while sending your message', responseCode = 500 } = error;
            res.status(responseCode).send(response);
            console.error(error);
        });
};

module.exports = { sendMessage };
