import { describe, it, expect, beforeEach } from 'vitest';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { createMock, DeepMocked } from '../../../../test/utils/createMock';
import { ConfigService } from '@nestjs/config';
import { EmailAppConfig } from '../../../shared/config/email-config.env';
import { Test, TestingModule } from '@nestjs/testing';
import { LoginGuard } from '../../../modules/authentication/api/login.guard';

const makeContext = (headers: Record<string, unknown>): ExecutionContext =>
    ({
        switchToHttp: () => ({
            getRequest: () => ({ headers }),
        }),
    }) as unknown as ExecutionContext;

describe('ApiKeyGuard', () => {
    const API_KEY: string = 'secret-key';
    let module: TestingModule;
    let sut: ApiKeyGuard;
    let configServiceMock: DeepMocked<ConfigService>;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                LoginGuard,
                {
                    provide: ConfigService<EmailAppConfig>,
                    useValue: createMock(ConfigService<EmailAppConfig>),
                },
            ],
        }).compile();

        sut = module.get(ApiKeyGuard);
        configServiceMock = module.get(ConfigService<EmailAppConfig>);
    });

    it('allows request when x-api-key header matches configured API key', () => {
        const ctx: ExecutionContext = makeContext({ 'x-api-key': API_KEY });
        expect(sut.canActivate(ctx)).toBe(true);
        expect(configServiceMock.getOrThrow).toHaveBeenCalledWith('EMAIL_MICROSERVICE');
    });

    it('throws UnauthorizedException when x-api-key header is missing', () => {
        const ctx: ExecutionContext = makeContext({});
        expect(() => sut.canActivate(ctx)).toThrow(UnauthorizedException);
        expect(() => sut.canActivate(ctx)).toThrow('Invalid API key');
    });

    it('throws UnauthorizedException when x-api-key header does not match', () => {
        const ctx: ExecutionContext = makeContext({ 'x-api-key': 'wrong-key' });
        expect(() => sut.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when x-api-key header is an array', () => {
        const ctx: ExecutionContext = makeContext({ 'x-api-key': [API_KEY] });
        expect(() => sut.canActivate(ctx)).toThrow(UnauthorizedException);
    });
});
