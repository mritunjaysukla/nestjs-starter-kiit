import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailProcessor } from './queue/mail.processor';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'mail',
    }),
  ],
  providers: [MailService, MailProcessor],
  exports: [MailService],
})
export class MailModule {}
