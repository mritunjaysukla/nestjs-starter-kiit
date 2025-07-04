// mail.service.spec.ts

// 1. Mock nodemailer before imports
const sendMailMock = jest.fn<Promise<{ accepted: string[] }>, [any]>()
  .mockResolvedValue({ accepted: ['test@example.com'] });

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: sendMailMock,
  })),
}));

// 2. Mock fs-extra before imports
const readFileMock = jest.fn<Promise<string>, [string, any]>();
jest.mock('fs-extra', () => ({
  readFile: readFileMock,
}));

// 3. Import after mocking
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs-extra';

describe('MailService', () => {
  let service: MailService;

  const configServiceMock = {
    get: jest.fn((key: string) => {
      const config = {
        'smtp.host': 'smtp.example.com',
        'smtp.port': 587,
        'smtp.user': 'user@example.com',
        'smtp.pass': 'password',
        'smtp.from': 'no-reply@example.com',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup fs-extra mock
    readFileMock.mockResolvedValue('template content');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send mail successfully', async () => {
    await expect(
      service.sendMail('test@example.com', 'Subject', '<p>Hello</p>'),
    ).resolves.not.toThrow();

    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'no-reply@example.com',
      to: 'test@example.com',
      subject: 'Subject',
      html: '<p>Hello</p>',
    });
  });

  it('should compile template', async () => {
    const html = await service.compileTemplate('welcome', { name: 'Test' });
    expect(html).toBe('template content');
    expect(readFileMock).toHaveBeenCalledWith(
      expect.stringContaining('welcome.hbs'),
      'utf8'
    );
  });
});