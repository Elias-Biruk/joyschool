import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Set required environment variables for testing
    process.env.DATABASE_URL = 'postgresql://joyschool_user:joyschool_dev_password@localhost:5432/joyschool?schema=public';
    process.env.JWT_SECRET = 'test-secret-key-min-32-chars-for-testing';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-min-32-chars';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.PORT = '3001';
    process.env.NODE_ENV = 'test';
    process.env.FRONTEND_URL = 'http://localhost:3000';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('/auth/register (POST)', () => {
    const uniqueEmail = `test${Date.now()}@example.com`;
    return request.default(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: uniqueEmail,
        password: 'Test123456@',
        firstName: 'Test',
        lastName: 'User',
        role: 'STUDENT',
      })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });
});
