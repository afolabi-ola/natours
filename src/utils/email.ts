import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { renderFile } from 'pug';
import { htmlToText } from 'html-to-text';
import { UserDocType } from '../models/userModel';

export default class Email {
  firstname: string;

  to: string;

  url: string;

  from: string;

  constructor(user: UserDocType, url: string) {
    this.firstname = user.name.split(' ')[0] || '';
    this.to = user.email;
    this.url = url;
    this.from = `Afolabi Ola <${process.env.EMAIL_FROM_PROD}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      const smtpOptions: SMTPTransport.Options = {
        host: process.env.EMAIL_HOST_PROD,
        port: Number(process.env.EMAIL_PORT_PROD),
        auth: {
          user: process.env.EMAIL_USERNAME_PROD,
          pass: process.env.EMAIL_PASSWORD_PROD,
        },
      };

      return nodemailer.createTransport(smtpOptions);
    }

    const smtpOptions: SMTPTransport.Options = {
      host: process.env.EMAIL_HOST_DEV,
      port: Number(process.env.EMAIL_PORT_DEV),
      secure: process.env.NODE_ENV_DEV === 'production',
    };

    return nodemailer.createTransport(smtpOptions);
  }

  //send the actual email
  async send(template: string, subject: string) {
    // 1. create the html template
    const html = renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstname: this.firstname,
      url: this.url,
      subject,
    });

    // 2. create the mail options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html: html,
      text: htmlToText(html),
    };

    //create transport and send email
    // await transporter.sendMail(mailOptions);
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)',
    );
  }
}
