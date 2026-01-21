import nodemailer from 'nodemailer';

let transporter = null;
let fromAddress = '';

const getTransporter = () => {
    if (transporter) return transporter;

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
        return null;
    }

    fromAddress = SMTP_FROM || SMTP_USER;
    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    return transporter;
};

export const sendEmail = async ({ to, subject, text, html }) => {
    const mailer = getTransporter();
    if (!mailer) return false;

    await mailer.sendMail({
        from: fromAddress,
        to,
        subject,
        text,
        html,
    });

    return true;
};
