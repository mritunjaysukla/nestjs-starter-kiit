import { Injectable } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as handlebars from 'handlebars';

@Injectable()
export class MailService {
  private readonly transporter: Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('smtp.host'),
      port: this.config.get<number>('smtp.port'),
      auth: {
        user: this.config.get<string>('smtp.user'),
        pass: this.config.get<string>('smtp.pass'),
      },
    }) as Transporter;
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('smtp.from'),
        to,
        subject,
        html,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Failed to send email:', error.message);
      } else {
        console.error('Unknown error sending email:', error);
      }
      throw error;
    }
  }

  async compileTemplate(templateName: string, context: Record<string, unknown>): Promise<string> {
    const templatePath = path.join(__dirname, '../../templates/emails', `${templateName}.hbs`);
    try {
      const source = await fs.readFile(templatePath, 'utf8');
      const compiled = handlebars.compile(source);
      return compiled(context);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error reading template:', error.message);
      } else {
        console.error('Unknown error reading template:', error);
      }
      throw error;
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const html = await this.compileTemplate('welcome', { name });
    await this.sendMail(to, 'Welcome to NestJS Starter Kit!', html);
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `https://your-frontend-domain.com/reset-password?token=${token}`;
    const html = await this.compileTemplate('password-reset', { resetUrl });
    await this.sendMail(to, 'Password Reset Request', html);
  }
}
