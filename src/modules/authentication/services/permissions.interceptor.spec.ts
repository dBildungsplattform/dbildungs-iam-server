import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { sign } from 'jsonwebtoken';

import { PersonPermissionsRepo } from '../domain/person-permission.repo.js';
import { PersonPermissions } from '../domain/person-permissions.js';
import { PermissionsInterceptor } from './permissions.interceptor.js';

describe('Permission Interceptor', () => {
    let module: TestingModule;

    let sut: PermissionsInterceptor;
    let permissionRepoMock: DeepMocked<PersonPermissionsRepo>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                PermissionsInterceptor,
                {
                    provide: PersonPermissionsRepo,
                    useValue: createMock<PersonPermissionsRepo>(),
                },
            ],
        }).compile();

        sut = module.get(PermissionsInterceptor);
        permissionRepoMock = module.get(PersonPermissionsRepo);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should call next middleware', () => {
        const nextMock: DeepMocked<CallHandler> = createMock<CallHandler>();

        sut.intercept(createMock(), nextMock);

        expect(nextMock.handle).toHaveBeenCalledTimes(1);
    });

    describe('when request contains passportUser', () => {
        it('should attach personPermissions function', async () => {
            const subjectId: string = faker.string.uuid();
            const request: DeepMocked<Request> = createMock<Request>({
                passportUser: {
                    access_token: sign({ sub: subjectId }, 'secret'),
                },
            });
            const context: DeepMocked<ExecutionContext> = createMock<ExecutionContext>({
                switchToHttp: () => createMock<HttpArgumentsHost>({ getRequest: () => request }),
            });
            permissionRepoMock.loadPersonPermissions.mockResolvedValueOnce(createMock<PersonPermissions>());

            sut.intercept(context, createMock());
            await expect(request.passportUser?.personPermissions()).resolves.toBeDefined();

            expect(request.passportUser?.personPermissions).toBeInstanceOf(Function);
            expect(permissionRepoMock.loadPersonPermissions).toHaveBeenCalledWith(subjectId);
        });
    });

    describe('when request is missing data', () => {
        it('should not fail when missing access-token', () => {
            const request: DeepMocked<Request> = createMock<Request>({
                passportUser: {
                    access_token: undefined,
                },
            });
            const context: DeepMocked<ExecutionContext> = createMock<ExecutionContext>({
                switchToHttp: () => createMock<HttpArgumentsHost>({ getRequest: () => request }),
            });

            expect(() => sut.intercept(context, createMock())).not.toThrow();
            expect(request.passportUser?.personPermissions).toBeUndefined();
        });

        it('should not fail when missing passportUser', () => {
            const request: DeepMocked<Request> = createMock<Request>({
                passportUser: undefined,
            });
            const context: DeepMocked<ExecutionContext> = createMock<ExecutionContext>({
                switchToHttp: () => createMock<HttpArgumentsHost>({ getRequest: () => request }),
            });

            expect(() => sut.intercept(context, createMock())).not.toThrow();
            expect(request.passportUser?.personPermissions).toBeUndefined();
        });

        it('should not fail when access-token is missing subject', () => {
            const request: DeepMocked<Request> = createMock<Request>({
                passportUser: { access_token: sign({}, 'secret') },
            });
            const context: DeepMocked<ExecutionContext> = createMock<ExecutionContext>({
                switchToHttp: () => createMock<HttpArgumentsHost>({ getRequest: () => request }),
            });

            expect(() => sut.intercept(context, createMock())).not.toThrow();
            expect(request.passportUser?.personPermissions).toBeUndefined();
        });

        it('should not fail when access-token is malformed', () => {
            const request: DeepMocked<Request> = createMock<Request>({
                passportUser: { access_token: 'malformed' },
            });
            const context: DeepMocked<ExecutionContext> = createMock<ExecutionContext>({
                switchToHttp: () => createMock<HttpArgumentsHost>({ getRequest: () => request }),
            });

            expect(() => sut.intercept(context, createMock())).not.toThrow();
            expect(request.passportUser?.personPermissions).toBeUndefined();
        });
    });
});
