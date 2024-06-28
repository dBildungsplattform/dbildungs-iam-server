import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationParameters, Client, Issuer, TokenSet, UserinfoResponse } from 'openid-client';

import { ConfigTestModule } from '../../../../test/utils/index.js';
import { OIDC_CLIENT } from '../services/oidc-client.service.js';
import { OpenIdConnectStrategy } from './oidc.strategy.js';
import { PassportUser } from '../types/user.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';
import { KeycloakUserNotFoundError } from '../domain/keycloak-user-not-found.error.js';

describe('OpenIdConnectStrategy', () => {
    let module: TestingModule;
    let sut: OpenIdConnectStrategy;
    let openIdClient: Client;
    let personRepositoryMock: DeepMocked<PersonRepository>;

    function createPerson(params: Partial<Person<boolean>> = {}): Person<true> {
        const person: Person<true> = Person.construct(
            faker.string.uuid(),
            faker.date.past(),
            faker.date.recent(),
            faker.person.lastName(),
            faker.person.firstName(),
            '1',
            faker.lorem.word(),
            undefined,
            faker.string.uuid(),
        );

        Object.assign(person, params);

        return person;
    }

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [
                OpenIdConnectStrategy,
                {
                    provide: OIDC_CLIENT,
                    useValue: new new Issuer({ issuer: 'oidc' }).Client({ client_id: 'DummyId' }),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
            ],
        }).compile();

        sut = module.get(OpenIdConnectStrategy);
        openIdClient = module.get(OIDC_CLIENT);
        personRepositoryMock = module.get(PersonRepository);
    });

    afterAll(async () => {
        await module.close();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('validate', () => {
        it('should call client.userinfo', async () => {
            jest.spyOn(openIdClient, 'userinfo').mockResolvedValueOnce(createMock<UserinfoResponse>());

            await sut.validate(new TokenSet());

            expect(openIdClient.userinfo).toHaveBeenCalled();
        });

        it('should call client.userinfo', async () => {
            const tokenSet: TokenSet = new TokenSet({
                id_token: faker.string.alpha(32),
                access_token: faker.string.alpha(32),
                refresh_token: faker.string.alpha(32),
            });
            const userinfo: UserinfoResponse = createMock<UserinfoResponse>();
            jest.spyOn(openIdClient, 'userinfo').mockResolvedValueOnce(userinfo);

            personRepositoryMock.findByKeycloakUserId.mockResolvedValueOnce(createPerson());

            const result: AuthorizationParameters = await sut.validate(tokenSet);

            expect(result).toMatchObject({ ...tokenSet, userinfo });
        });

        it('should throw UnauthorizedException if userinfo fails', async () => {
            jest.spyOn(openIdClient, 'userinfo').mockRejectedValueOnce(new Error());

            await expect(sut.validate(new TokenSet())).rejects.toThrow(UnauthorizedException);
        });

        it('should set personPermissions to return rejected promise', async () => {
            jest.spyOn(openIdClient, 'userinfo').mockResolvedValueOnce(createMock<UserinfoResponse>());
            personRepositoryMock.findByKeycloakUserId.mockResolvedValueOnce(createPerson());

            const user: AuthorizationParameters & PassportUser = await sut.validate(new TokenSet());

            await expect(user.personPermissions()).rejects.toBeUndefined();
        });

        it('should throw KeycloakUserNotFoundError if keycloak-user does not exist', async () => {
            jest.spyOn(openIdClient, 'userinfo').mockResolvedValueOnce(createMock<UserinfoResponse>());
            personRepositoryMock.findByKeycloakUserId.mockResolvedValueOnce(undefined);

            await expect(sut.validate(new TokenSet())).rejects.toThrow(KeycloakUserNotFoundError);
        });
    });
});
