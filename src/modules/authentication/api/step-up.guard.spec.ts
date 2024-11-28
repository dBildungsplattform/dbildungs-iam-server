import { StepUpGuard } from './steup-up.guard.js';
import { ExecutionContext } from '@nestjs/common';
import { RequiredStepUpLevelNotMetError } from '../domain/required-step-up-level-not-met.error.js';
import { StepUpLevel, extractStepUpLevelFromJWT } from '../passport/oidc.strategy.js';
import { Request } from 'express';
import { UserinfoResponse } from 'openid-client';
import { PersonPermissions } from '../domain/person-permissions.js';
import { createMock } from '@golevelup/ts-jest';

jest.mock(
    '../passport/oidc.strategy.js',
    (): Partial<typeof import('../passport/oidc.strategy.js')> => ({
        ...jest.requireActual('../passport/oidc.strategy.js'),
        extractStepUpLevelFromJWT: jest.fn(),
    }),
);

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
                personPermissions: (): Promise<PersonPermissions> => Promise.resolve(personPermissionsMock),
            },
        };

        return {
            switchToHttp: (): { getRequest: () => Partial<Request> } => ({
                getRequest: (): Partial<Request> => request,
            }),
        } as ExecutionContext;
    };

    const createMockExecutionContextWithToken = (accessToken?: string): ExecutionContext => {
        const userInfoResponse: UserinfoResponse = {
            sub: '123',
            name: 'John Doe',
            given_name: 'John',
            family_name: 'Doe',
            email: 'test@test.com',
        };

        const request: Partial<Request> = {
            passportUser: {
                access_token: accessToken,
                userinfo: userInfoResponse,
                personPermissions: (): Promise<PersonPermissions> => Promise.reject(),
            },
        };

        return {
            switchToHttp: (): { getRequest: () => Partial<Request> } => ({
                getRequest: (): Partial<Request> => request,
            }),
        } as ExecutionContext;
    };

    it('should throw RequiredStepUpLevelNotMetError if accessToken is undefined', () => {
        const context: ExecutionContext = createMockExecutionContextWithToken(undefined);

        expect(() => guard.canActivate(context)).toThrow(RequiredStepUpLevelNotMetError);
        expect(extractStepUpLevelFromJWT).not.toHaveBeenCalled();
    });

    it('should allow access if stepUpLevel is GOLD', () => {
        const context: ExecutionContext = createMockExecutionContext(StepUpLevel.GOLD);
        expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw RequiredStepUpLevelNotMetError if stepUpLevel is not GOLD', () => {
        const context: ExecutionContext = createMockExecutionContext(StepUpLevel.SILVER);

        expect(() => guard.canActivate(context)).toThrow(RequiredStepUpLevelNotMetError);
    });

    it('should throw RequiredStepUpLevelNotMetError if stepUpLevel is undefined', () => {
        const context: ExecutionContext = createMockExecutionContext();

        expect(() => guard.canActivate(context)).toThrow(RequiredStepUpLevelNotMetError);
    });

    it('should allow access if stepUpLevel is extracted as GOLD from token', () => {
        const context: ExecutionContext = createMockExecutionContextWithToken('mockToken');
        (extractStepUpLevelFromJWT as jest.Mock).mockReturnValue(StepUpLevel.GOLD);

        expect(guard.canActivate(context)).toBe(true);
        expect(extractStepUpLevelFromJWT).toHaveBeenCalledWith('mockToken');
    });

    it('should throw RequiredStepUpLevelNotMetError if extracted stepUpLevel is not GOLD', () => {
        const context: ExecutionContext = createMockExecutionContextWithToken('mockToken');
        (extractStepUpLevelFromJWT as jest.Mock).mockReturnValue(StepUpLevel.SILVER);

        expect(() => guard.canActivate(context)).toThrow(RequiredStepUpLevelNotMetError);
        expect(extractStepUpLevelFromJWT).toHaveBeenCalledWith('mockToken');
    });

    it('should throw RequiredStepUpLevelNotMetError if token does not result in a valid stepUpLevel', () => {
        const context: ExecutionContext = createMockExecutionContextWithToken('mockToken');
        (extractStepUpLevelFromJWT as jest.Mock).mockReturnValue('INVALID_LEVEL');

        expect(() => guard.canActivate(context)).toThrow(RequiredStepUpLevelNotMetError);
        expect(extractStepUpLevelFromJWT).toHaveBeenCalledWith('mockToken');
    });
});
