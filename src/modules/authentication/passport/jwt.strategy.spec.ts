import { JwtStrategy } from './jwt.strategy.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BaseClient, Client } from 'openid-client';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { KeycloakUserNotFoundError } from '../domain/keycloak-user-not-found.error.js';
import jwt from 'jsonwebtoken';
import { faker } from '@faker-js/faker';

describe('JWT Strategy', () => {
    it('should extract a bearer token from the header and return it for session storage', async () => {
        const client: DeepMocked<BaseClient> = createMock<Client>({
            issuer: { metadata: { jwks_uri: 'https://nowhere.example.com' } },
        });
        const personRepositoryMock: DeepMocked<PersonRepository> = createMock<PersonRepository>();
        const sut: JwtStrategy = new JwtStrategy(client, personRepositoryMock);
        const request: Request = createMock<Request & { headers: { authorization: string } }>({
            headers: { authorization: 'Bearer 12345' },
        });
        const sessionContent: { access_token: string } = await sut.validate(request, '');

        expect(sessionContent.access_token).toEqual('12345');
    });

    it('should return empty string if no accessToken can be extracted', async () => {
        const client: DeepMocked<BaseClient> = createMock<Client>({
            issuer: { metadata: { jwks_uri: 'https://nowhere.example.com' } },
        });
        const personRepositoryMock: DeepMocked<PersonRepository> = createMock<PersonRepository>();
        const sut: JwtStrategy = new JwtStrategy(client, personRepositoryMock);
        const request: Request = createMock<Request & { headers: { authorization: string } }>({
            headers: { authorization: '' },
        });
        const sessionContent: { access_token: string } = await sut.validate(request, '');

        expect(sessionContent.access_token).toEqual('');
    });

    it('should throw KeycloakUserNotFoundError if the kc user does not exist', async () => {
        const client: DeepMocked<BaseClient> = createMock<Client>({
            issuer: { metadata: { jwks_uri: 'https://nowhere.example.com' } },
        });
        const personRepositoryMock: DeepMocked<PersonRepository> = createMock<PersonRepository>();
        personRepositoryMock.findByKeycloakUserId.mockResolvedValueOnce(undefined);
        const sut: JwtStrategy = new JwtStrategy(client, personRepositoryMock);

        jest.spyOn(jwt, 'decode').mockReturnValue({
            sub: faker.string.uuid().toString(),
        });
        const request: Request = createMock<Request & { headers: { authorization: string } }>({
            headers: { authorization: 'Bearer 12345' },
        });

        await expect(sut.validate(request, '')).rejects.toThrow(KeycloakUserNotFoundError);
    });
});
