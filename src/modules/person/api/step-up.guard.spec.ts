import { StepUpGuard } from './steup-up.guard.js';
import { ExecutionContext } from '@nestjs/common';
import { RequiredStepUpLevelNotMetError } from '../domain/required-step-up-level-not-met.error.js';
import { StepUpLevel } from '../../authentication/passport/oidc.strategy.js';
import { Request } from 'express';
import { UserinfoResponse } from 'openid-client';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { createMock } from '@golevelup/ts-jest';

describe('StepUpGuard', () => {
    let guard: StepUpGuard;

    beforeEach(() => {
        guard = new StepUpGuard();
    });

    const createMockExecutionContext = (stepUpLevel?: StepUpLevel): ExecutionContext => {
        const userInfoResponse: UserinfoResponse = {
            sub: '123',
            name: 'John Doe',
            given_name: 'John',
            family_name: 'Doe',
            email: 'test@test.com',
        };

        const personPermissionsMock: PersonPermissions = createMock<PersonPermissions>();

        const request: Partial<Request> = {
            passportUser: {
                stepUpLevel,
                userinfo: userInfoResponse,
                personPermissions: () => Promise.resolve(personPermissionsMock),
            },
        };

        return {
            switchToHttp: () => ({
                getRequest: () => request,
            }),
        } as ExecutionContext;
    };

    it('should allow access if stepUpLevel is GOLD', () => {
        const context = createMockExecutionContext(StepUpLevel.GOLD);
        expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw RequiredStepUpLevelNotMetError if stepUpLevel is not GOLD', () => {
        const context = createMockExecutionContext(StepUpLevel.SILVER);

        expect(() => guard.canActivate(context)).toThrow(RequiredStepUpLevelNotMetError);
    });

    it('should throw RequiredStepUpLevelNotMetError if stepUpLevel is undefined', () => {
        const context = createMockExecutionContext(undefined);

        expect(() => guard.canActivate(context)).toThrow(RequiredStepUpLevelNotMetError);
    });
});
