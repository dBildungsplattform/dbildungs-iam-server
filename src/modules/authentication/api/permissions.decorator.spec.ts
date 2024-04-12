import { Permissions } from './permissions.decorator.js';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants.js';
import { PersonPermissions } from '../domain/person-permissions.js';
import { ExecutionContext } from '@nestjs/common';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import express from 'express';

describe('The Permissions-Decorator', () => {
    let factory: (data: unknown, context: ExecutionContext) => Promise<PersonPermissions | undefined>;

    beforeEach(() => {
        class Demo {
            public blah(_unused: PersonPermissions): void {}
        }

        const target: Demo = new Demo();

        Permissions()(target, 'blah', 0);
        const decoratorFunction: object = Reflect.getMetadata(
            ROUTE_ARGS_METADATA,
            target.constructor,
            'blah',
        ) as object;
        expect(decoratorFunction).toBeDefined();

        factory = (
            Object.values(decoratorFunction)[0] as {
                factory: (data: unknown, context: ExecutionContext) => Promise<PersonPermissions | undefined>;
            }
        ).factory;
    });

    it('should inject a PersonPermissions object if one is in the request', async () => {
        const executionContext: DeepMocked<ExecutionContext> = createMock();
        const request: DeepMocked<express.Request> = createMock();
        executionContext.switchToHttp().getRequest.mockReturnValue(request);
        const personPermissions: PersonPermissions = createMock();

        request.passportUser = {
            userinfo: createMock(),
            personPermissions: (): Promise<PersonPermissions> => {
                return Promise.resolve(personPermissions);
            },
        };

        await expect(factory(null, executionContext)).resolves.toBe(personPermissions);
    });

    it('should reject if there is no passport user', async () => {
        const context: ExecutionContext = createMock();
        context.switchToHttp().getRequest<DeepMocked<express.Request>>().passportUser = undefined;

        await expect(factory(null, context)).rejects.toBeUndefined();
    });
});
