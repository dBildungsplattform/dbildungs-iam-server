import { createMock } from '@golevelup/ts-jest';
import { CanActivate, Controller, ExecutionContext, Get, INestApplication, UseGuards } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import request from 'supertest';

import { CurrentUser, User } from './user.decorator.js';
import { faker } from '@faker-js/faker';
import { App } from 'supertest/types.js';

describe('CurrentUserDecorator', () => {
    let currentUser: User | undefined;

    @Controller('currentuser')
    class CurrentUserDecoratorTestController {
        @UseGuards(
            createMock<CanActivate>({
                canActivate(context: ExecutionContext) {
                    const req: Request = context.switchToHttp().getRequest<Request>();
                    req.user = currentUser;
                    return true;
                },
            }),
        )
        @Get('test')
        public test(@CurrentUser() user: User): User {
            return user;
        }
    }

    let module: TestingModule;
    let app: INestApplication;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [CurrentUserDecoratorTestController],
        }).compile();

        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
        await module.close();
    });

    it('Should return the value of request.user', async () => {
        currentUser = {
            access_token: faker.string.alphanumeric(32),
            id_token: faker.string.alphanumeric(32),
            userinfo: { sub: faker.string.uuid() },
        };

        const result: request.Response = await request(app.getHttpServer() as App).get('/currentuser/test');

        expect(result.body).toEqual(currentUser);
    });
});
