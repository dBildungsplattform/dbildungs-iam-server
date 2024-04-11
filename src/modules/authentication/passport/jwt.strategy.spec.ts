import { JwtStrategy } from './jwt.strategy.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BaseClient, Client } from 'openid-client';

describe('JWT Strategy', () => {
    it('should extract a bearer token from the header and return it for session storage', () => {
        const client: DeepMocked<BaseClient> = createMock<Client>({
            issuer: { metadata: { jwks_uri: 'https://nowhere.example.com' } },
        });
        const sut: JwtStrategy = new JwtStrategy(client);
        const request: Request = createMock<Request & { headers: { authorization: string } }>({
            headers: { authorization: 'Bearer 12345' },
        });
        const sessionContent: { access_token: string } = sut.validate(request, '');

        expect(sessionContent.access_token).toEqual('12345');
    });

    it('should return empty string if no accessToken can be extracted', () => {
        const client: DeepMocked<BaseClient> = createMock<Client>({
            issuer: { metadata: { jwks_uri: 'https://nowhere.example.com' } },
        });
        const sut: JwtStrategy = new JwtStrategy(client);
        const request: Request = createMock<Request & { headers: { authorization: string } }>({
            headers: { authorization: '' },
        });
        const sessionContent: { access_token: string } = sut.validate(request, '');

        expect(sessionContent.access_token).toEqual('');
    });
});
