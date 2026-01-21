import nodemailer from 'nodemailer';

let transporter = null;
let fromUser = '';

const getTransporter = () => {
    if (!transporter) {
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
        if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
            return null;
        }
        fromUser = SMTP_USER;
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            auth: { user: SMTP_USER, pass: SMTP_PASS },
        });
    }
    return transporter;
};

export const sendEmail = async ({ to, subject, text }) => {
    const mailer = getTransporter();
    if (!mailer) return false;
    await mailer.sendMail({
        from: process.env.SMTP_FROM || fromUser,
        to,
        subject,
        text,
    });
    return true;
};
