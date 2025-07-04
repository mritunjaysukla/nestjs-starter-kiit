import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepo.findOneBy({ id });
  }

  async findByEmail(email: string) {
    return this.userRepo.findOneBy({ email });
  }

  async create(email: string, password: string): Promise<User> {
    const user = this.userRepo.create({ email, password });
    return this.userRepo.save(user);
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepo.findOneBy({ resetToken: token });
  }

  async save(user: User): Promise<User> {
    return this.userRepo.save(user);
  }
}
