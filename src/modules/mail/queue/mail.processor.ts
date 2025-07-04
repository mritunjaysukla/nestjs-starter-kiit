import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MailService } from '../mail.service';

@Processor('mail')
export class MailProcessor {
  constructor(private readonly mailService: MailService) {}

  @Process('send-welcome')
  async handleWelcome(job: Job<{ to: string; name: string }>) {
    const { to, name } = job.data;
    await this.mailService.sendWelcomeEmail(to, name);
  }
}
