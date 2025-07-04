import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as handlebars from 'handlebars';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('smtp.host'),
      port: config.get('smtp.port'),
      auth: {
        user: config.get('smtp.user'),
        pass: config.get('smtp.pass'),
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    return this.transporter.sendMail({
      from: this.config.get('smtp.from'),
      to,
      subject,
      html,
    });
  }

  async compileTemplate(templateName: string, context: any): Promise<string> {
    const templatePath = path.join(__dirname, '../../templates/emails', `${templateName}.hbs`);
    const source = await fs.readFile(templatePath, 'utf8');
    const compiled = handlebars.compile(source);
    return compiled(context);
  }

  async sendWelcomeEmail(to: string, name: string) {
    const html = await this.compileTemplate('welcome', { name });
    return this.sendMail(to, 'Welcome to NestJS Starter Kit!', html);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `https://your-frontend-domain.com/reset-password?token=${token}`;
    const html = await this.compileTemplate('password-reset', { resetUrl });
    return this.sendMail(to, 'Password Reset Request', html);
  }
}
