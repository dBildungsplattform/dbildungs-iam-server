import { JwtStrategy } from './jwt.strategy.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BaseClient, Client } from 'openid-client';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { KeycloakUserNotFoundError } from '../domain/keycloak-user-not-found.error.js';

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

    it('should check if the user exist when  it for session storage', async () => {
        const client: DeepMocked<BaseClient> = createMock<Client>({
            issuer: { metadata: { jwks_uri: 'https://nowhere.example.com' } },
        });
        const personRepositoryMock: DeepMocked<PersonRepository> = createMock<PersonRepository>();
        personRepositoryMock.findByKeycloakUserId.mockResolvedValueOnce(undefined);
        const sut: JwtStrategy = new JwtStrategy(client, personRepositoryMock);
        const request: Request = createMock<Request & { headers: { authorization: string } }>({
            headers: {
                authorization:
                    'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJYc0o4UFhnUndINFhlQ3dZV2VBdFFrdEdxbUN4RDAyMkEyRFRoQURZa1pvIn0.eyJleHAiOjE3MjAxNTc2MTIsImlhdCI6MTcyMDE1NzMxMiwiYXV0aF90aW1lIjoxNzIwMTU3MzEyLCJqdGkiOiJlNGYyNzdjOS1jMjMxLTQxMzgtYmFhOC0yYTEwMmQwZmViZWEiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvcmVhbG1zL1NQU0giLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiNGY4YmY3YzQtNTU3MS00NGM0LTllZDAtYmYwYmVmY2QzNTVlIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoic3BzaCIsInNlc3Npb25fc3RhdGUiOiIyMTU1ZjNkYi0zYmY0LTRlYWQtOWY3MC1kNDM0Yzg4NTQwMDIiLCJhY3IiOiIwIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vbG9jYWxob3N0OjgwOTkiLCJodHRwOi8vMTI3LjAsMC4xOjkwOTAiLCJodHRwOi8vbG9jYWxob3N0OjkwOTAiLCJodHRwczovLzEyNy4wLDAuMTo4MDk5Il0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJkZWZhdWx0LXJvbGVzLXNwc2giLCJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwic2lkIjoiMjE1NWYzZGItM2JmNC00ZWFkLTlmNzAtZDQzNGM4ODU0MDAyIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJwdGVzdCJ9.SPdY5w8eAU35i1mg2VzI15tiM2TKn5uN2aDrj15V7_ekTEn4Z2KQHYMZ4RMyInyECfu93ebKLWF1P4Acdv2nZ8f4ukWHZvd8NTjACkqMOC6_O-cjIe9Qk_B9phMgUk-y4vN2p9KWdO-q0oEjFroOHrVwE3Uc9U10Tw8ZCplGFkl5_I0PgMVnto-T9Bpw4fiwDMX_dK4-bhiGeYXP5IOKj6kmC_x_2o3AHZCIZ7CAGeSLkjfcFUEHqeaL81y1JZTpDsf1PFMhwIvGTuheJ17a8sE8X63fN3UIAkoYaVyCJv9DwdaCK6-jf6MARirLHoS9jx8DNhKwOjxaL3mqG8TuXg',
            },
        });

        await expect(sut.validate(request, '')).rejects.toThrow(KeycloakUserNotFoundError);
    });
});
