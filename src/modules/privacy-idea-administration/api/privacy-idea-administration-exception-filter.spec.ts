import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ArgumentsHost } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import {
    DbiamPrivacyIdeaAdministrationError,
    PrivacyIdeaAdministrationErrorI18nTypes,
} from './error/dbiam-privacy-idea-administration.error.js';
import { HardwareTokenServiceError } from './error/hardware-token-service.error.js';
import { OTPnotValidError } from './error/otp-not-valid.error.js';
import { SerialInUseError } from './error/serial-in-use.error.js';
import { SerialNotFoundError } from './error/serial-not-found.error.js';
import { TokenError } from './error/token.error.js';
import { PrivacyIdeaAdministrationExceptionFilter } from './privacy-idea-administration-exception-filter.js';

describe('PrivacyIdeaAdministrationExceptionFilter', () => {
    let filter: PrivacyIdeaAdministrationExceptionFilter;
    const statusCode: number = 500;
    let responseMock: DeepMocked<Response>;
    let argumentsHost: DeepMocked<ArgumentsHost>;

    const generalBadRequestError: DbiamPrivacyIdeaAdministrationError = new DbiamPrivacyIdeaAdministrationError({
        code: 500,
        i18nKey: PrivacyIdeaAdministrationErrorI18nTypes.PRIVACY_IDEA_ADMINISTRATION_ERROR,
    });

    beforeEach(() => {
        filter = new PrivacyIdeaAdministrationExceptionFilter();
        responseMock = createMock<Response>();
        argumentsHost = createMock<ArgumentsHost>({
            switchToHttp: () =>
                createMock<HttpArgumentsHost>({
                    getResponse: () => responseMock,
                }),
        });
    });

    describe('catch', () => {
        describe('when filter catches SerialNotFoundError', () => {
            it('should respond with SerialNotFoundError mapped error', () => {
                const error: SerialNotFoundError = new SerialNotFoundError();

                filter.catch(error, argumentsHost);

                expect(responseMock.status).toHaveBeenCalledWith(400);
                expect(responseMock.json).toHaveBeenCalledWith(
                    new DbiamPrivacyIdeaAdministrationError({
                        code: 400,
                        i18nKey: PrivacyIdeaAdministrationErrorI18nTypes.SERIENNUMMER_NICHT_GEFUNDEN,
                    }),
                );
            });
        });

        describe('when filter catches SerialInUseError', () => {
            it('should respond with SerialInUseError mapped error', () => {
                const error: SerialInUseError = new SerialInUseError();

                filter.catch(error, argumentsHost);

                expect(responseMock.status).toHaveBeenCalledWith(400);
                expect(responseMock.json).toHaveBeenCalledWith(
                    new DbiamPrivacyIdeaAdministrationError({
                        code: 400,
                        i18nKey: PrivacyIdeaAdministrationErrorI18nTypes.SERIENNUMMER_IN_VERWENDUNG,
                    }),
                );
            });
        });

        describe('when filter catches OTPnotValidError', () => {
            it('should respond with OTPnotValidError mapped error', () => {
                const error: OTPnotValidError = new OTPnotValidError();

                filter.catch(error, argumentsHost);

                expect(responseMock.status).toHaveBeenCalledWith(400);
                expect(responseMock.json).toHaveBeenCalledWith(
                    new DbiamPrivacyIdeaAdministrationError({
                        code: 400,
                        i18nKey: PrivacyIdeaAdministrationErrorI18nTypes.OTP_NICHT_GUELTIG,
                    }),
                );
            });
        });

        describe('when filter catches HardwareTokenServiceError', () => {
            it('should respond with HardwareTokenServiceError mapped error', () => {
                const error: HardwareTokenServiceError = new HardwareTokenServiceError();

                filter.catch(error, argumentsHost);

                expect(responseMock.status).toHaveBeenCalledWith(400);
                expect(responseMock.json).toHaveBeenCalledWith(
                    new DbiamPrivacyIdeaAdministrationError({
                        code: 400,
                        i18nKey: PrivacyIdeaAdministrationErrorI18nTypes.HARDWARE_TOKEN_SERVICE_FEHLER,
                    }),
                );
            });
        });

        describe('when filter catches undefined error', () => {
            it('should respond with a general PrivacyIdeaAdministrationError', () => {
                const error: TokenError = new TokenError('Undefined error', '');

                filter.catch(error, argumentsHost);

                expect(responseMock.status).toHaveBeenCalledWith(statusCode);
                expect(responseMock.json).toHaveBeenCalledWith(generalBadRequestError);
            });
        });
    });
});
