import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationParameters, Client, TokenSet, UserinfoResponse } from 'openid-client';

import { ConfigTestModule } from '../../../../test/utils/index.js';
import { OIDC_CLIENT } from './oidc-client.service.js';
import { OpenIdConnectStrategy } from './oidc.strategy.js';

jest.mock('@nestjs/passport', () => ({
    PassportStrategy: jest.fn(() => Object),
}));

describe('OpenIdConnectStrategy', () => {
    let module: TestingModule;
    let sut: OpenIdConnectStrategy;
    let openIdClientMock: DeepMocked<Client>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [
                OpenIdConnectStrategy,
                {
                    provide: OIDC_CLIENT,
                    useValue: createMock<Client>(),
                },
            ],
        }).compile();

        sut = module.get(OpenIdConnectStrategy);
        openIdClientMock = module.get(OIDC_CLIENT);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('validate', () => {
        it('should call client.userinfo', async () => {
            openIdClientMock.userinfo.mockResolvedValueOnce(createMock<UserinfoResponse>());

            await sut.validate(new TokenSet());

            expect(openIdClientMock.userinfo).toHaveBeenCalled();
        });

        it('should call client.userinfo', async () => {
            const tokenSet: TokenSet = new TokenSet({
                id_token: faker.string.alpha(32),
                access_token: faker.string.alpha(32),
                refresh_token: faker.string.alpha(32),
            });
            const userinfo: UserinfoResponse = createMock<UserinfoResponse>();
            openIdClientMock.userinfo.mockResolvedValueOnce(userinfo);

            const result: AuthorizationParameters = await sut.validate(tokenSet);

            expect(result).toEqual({ ...tokenSet, userinfo });
        });

        it('should throw UnauthorizedException if userinfo fails', async () => {
            openIdClientMock.userinfo.mockRejectedValueOnce(new Error());

            await expect(sut.validate(new TokenSet())).rejects.toThrow(UnauthorizedException);
        });
    });
});
