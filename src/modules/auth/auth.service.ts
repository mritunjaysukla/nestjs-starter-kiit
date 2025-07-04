import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { randomBytes } from 'crypto';
import { addHours, isBefore } from 'date-fns';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private mailService: MailService,
    @InjectQueue('mail') private mailQueue: Queue,
  ) {}

  async signup(email: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);
    const user = await this.userService.create(email, hashed);
    // 📨 Queue email instead of sending directly
    await this.mailQueue.add('send-welcome', { to: email, name: email.split('@')[0] });

    return this.signToken(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.signToken(user.id, user.email);
  }

  private signToken(userId: string, email: string) {
    return {
      access_token: this.jwtService.sign({
        sub: userId,
        email,
      }),
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      // For security, do not reveal user existence
      return;
    }

    // Generate reset token and expiry (e.g., 1 hour)
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = addHours(new Date(), 1);

    user.resetToken = resetToken;
    user.resetTokenExpiresAt = expiresAt;
    await this.userService.save(user);

    // Send reset email
    await this.mailService.sendPasswordResetEmail(email, resetToken);
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userService.findByResetToken(token);
    if (!user || !user.resetTokenExpiresAt || isBefore(user.resetTokenExpiresAt, new Date())) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiresAt = null;
    await this.userService.save(user);
  }
}
