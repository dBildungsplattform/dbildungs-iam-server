import { ArgumentsHost, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { SchulConnexAuthenticationDomainErrorFilter } from './schulconnex-authentication-domain-error-filter.js';
import { AuthenticationDomainError } from '../../authentication/domain/authentication-domain.error.js';
import { KeycloakUserNotFoundError } from '../../authentication/domain/keycloak-user-not-found.error.js';
import { RequiredStepUpLevelNotMetError } from '../../authentication/domain/required-step-up-level-not-met.error.js';

describe('AuthenticationDomainErrorFilter', () => {
    let filter: SchulConnexAuthenticationDomainErrorFilter;
    const statusCode: number = 403;
    let responseMock: Partial<Response>;
    let argumentsHost: Partial<ArgumentsHost>;

    const generalAuthenticationError: SchulConnexError = new SchulConnexError({
        code: statusCode,
        subcode: '00',
        titel: 'Authentifizierung fehlgeschlagen',
        beschreibung: 'Authentifizierung fehlgeschlagen',
    });

    const keycloakUserNotFoundError: SchulConnexError = new SchulConnexError({
        code: 403,
        subcode: '00',
        titel: 'Fehlende Rechte',
        beschreibung:
            'Die Autorisierung war erfolgreich, aber die erforderlichen Rechte für die Nutzung dieses Endpunktes sind nicht vorhanden.',
    });

    const requiredStepUpLevelNotMetError: SchulConnexError = new SchulConnexError({
        code: 403,
        subcode: '00',
        titel: 'Fehlende Rechte',
        beschreibung:
            'Die Autorisierung war erfolgreich, aber die erforderlichen Rechte für die Nutzung dieses Endpunktes sind nicht vorhanden.',
    });

    const unauthorizedError: SchulConnexError = new SchulConnexError({
        code: 401,
        subcode: '00',
        titel: 'Zugang verweigert',
        beschreibung: 'Die Anfrage konnte aufgrund fehlender Autorisierung nicht verarbeitet werden.',
    });

    beforeEach(() => {
        filter = new SchulConnexAuthenticationDomainErrorFilter();
        responseMock = {
            setHeader: vi.fn().mockReturnThis(),
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
        } as unknown as Response;

        const httpArgumentsHostMock: Partial<HttpArgumentsHost> = {
            getResponse: vi.fn().mockReturnValue(responseMock),
            getRequest: vi.fn().mockReturnValue({} as Request),
        };

        argumentsHost = {
            switchToHttp: vi.fn().mockReturnValue(httpArgumentsHostMock as HttpArgumentsHost),
            getHandler: vi.fn().mockReturnValue(() => {}),
            getClass: vi.fn().mockReturnValue(class {}),
        } as unknown as ArgumentsHost;
    });

    describe('catch', () => {
        describe('when filter catches undefined authentication error', () => {
            it('should throw a general schulconnex exception', () => {
                const authenticationError: AuthenticationDomainError = new AuthenticationDomainError(
                    'Authentifizierung fehlgeschlagen',
                    undefined,
                );

                filter.catch(authenticationError, argumentsHost as ArgumentsHost);

                expect(responseMock.json).toHaveBeenCalled();
                expect(responseMock.status).toHaveBeenCalledWith(statusCode);
                expect(responseMock.json).toHaveBeenCalledWith(generalAuthenticationError);
            });
        });

        describe('when filter catches a keycloakUserNotFoundError error', () => {
            it('should throw an authentication schulconnex exception', () => {
                const authenticationError: KeycloakUserNotFoundError = new KeycloakUserNotFoundError();
                filter.catch(authenticationError, argumentsHost as ArgumentsHost);

                expect(responseMock.json).toHaveBeenCalled();
                expect(responseMock.status).toHaveBeenCalledWith(statusCode);
                expect(responseMock.json).toHaveBeenCalledWith(keycloakUserNotFoundError);
            });
        });

        describe('when filter catches a requiredStepUpLevelNotMetError error ', () => {
            it('should throw an authentication schulconnex exception', () => {
                const authenticationError: RequiredStepUpLevelNotMetError = new RequiredStepUpLevelNotMetError();
                filter.catch(authenticationError, argumentsHost as ArgumentsHost);

                expect(responseMock.json).toHaveBeenCalled();
                expect(responseMock.status).toHaveBeenCalledWith(statusCode);
                expect(responseMock.json).toHaveBeenCalledWith(requiredStepUpLevelNotMetError);
            });
        });

        describe('when filter catches an unauthorized error ', () => {
            it('should throw an authentication schulconnex exception', () => {
                const authenticationError: UnauthorizedException = new UnauthorizedException();
                filter.catch(authenticationError, argumentsHost as ArgumentsHost);

                expect(responseMock.json).toHaveBeenCalled();
                expect(responseMock.status).toHaveBeenCalledWith(401);
                expect(responseMock.json).toHaveBeenCalledWith(unauthorizedError);
            });
        });
    });
});
