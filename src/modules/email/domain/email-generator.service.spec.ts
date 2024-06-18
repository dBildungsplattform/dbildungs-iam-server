import { Test, TestingModule } from '@nestjs/testing';

import { EmailGeneratorService } from './email-generator.service.js';
import { faker } from '@faker-js/faker';
import {
    InvalidAttributeLengthError,
    InvalidCharacterSetError,
    InvalidNameError,
} from '../../../shared/error/index.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Email } from './email.js';
import { EmailServiceRepo } from '../persistence/email-service.repo.js';

describe('EmailGeneratorService', () => {
    let module: TestingModule;
    let sut: EmailGeneratorService;
    let emailServiceRepoMock: DeepMocked<EmailServiceRepo>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                EmailGeneratorService,
                {
                    provide: EmailServiceRepo,
                    useValue: createMock<EmailServiceRepo>(),
                },
            ],
        }).compile();
        sut = module.get(EmailGeneratorService);
        emailServiceRepoMock = module.get(EmailServiceRepo);
    });

    afterAll(async () => {
        await module.close();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('generateName', () => {
        describe('when firstname has less than 2 characters', () => {
            it('should return error', async () => {
                await expect(sut.generateName('', faker.string.alpha({ length: 2 }))).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidAttributeLengthError('name.vorname'),
                });
            });
        });

        describe('when lastname has less than 2 characters', () => {
            it('should return error', async () => {
                await expect(sut.generateName(faker.string.alpha({ length: 2 }), '')).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidAttributeLengthError('name.familienname'),
                });
            });
        });

        describe('when firstname is not isDIN91379A', () => {
            it('should return error', async () => {
                await expect(sut.generateName('123^^$/()', 'Rottelburg')).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidCharacterSetError('name.vorname', 'DIN-91379A'),
                });
            });
        });

        describe('when lastname is not isDIN91379A', () => {
            it('should return error', async () => {
                await expect(sut.generateName('Torsten', '123^^$/()')).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidCharacterSetError('name.familienname', 'DIN-91379A'),
                });
            });
        });

        describe('when contains special characters', () => {
            it('should normalize german, danish and french special characters', async () => {
                emailServiceRepoMock.findByName.mockResolvedValueOnce(undefined);
                await expect(sut.generateName('Åron', 'åàâçèéêëîïôùûÿäæöøœüß')).resolves.toStrictEqual({
                    ok: true,
                    value: 'aaaaaceeeeiiouuyaeaeoeoeoeuess',
                });
            });
        });

        describe('when contains diacritics', () => {
            it('should remove diacritics', async () => {
                emailServiceRepoMock.findByName.mockResolvedValueOnce(undefined);
                await expect(sut.generateName('Èlène', 'Lunâtiz')).resolves.toStrictEqual({
                    ok: true,
                    value: 'elunatiz',
                });
            });
        });

        describe('when firstname contains invalid character set', () => {
            it('should not accept invalid character set in firstname', async () => {
                emailServiceRepoMock.findByName.mockResolvedValueOnce(undefined);

                await expect(sut.generateName('Èlène?', 'L.,unâtiz')).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidCharacterSetError('name.vorname', 'DIN-91379A'),
                });
            });
        });

        describe('when lastname contains invalid character set', () => {
            it('should not accept invalid character set in lastname', async () => {
                emailServiceRepoMock.findByName.mockResolvedValueOnce(undefined);

                await expect(sut.generateName('Èlène', 'L.,unâtiz?')).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidCharacterSetError('name.familienname', 'DIN-91379A'),
                });
            });
        });

        describe('when contains non-letters N1 (bnlreq)', () => {
            it('should remove non-letters N1 (bnlreq) chars', async () => {
                emailServiceRepoMock.findByName.mockResolvedValueOnce(undefined);

                await expect(sut.generateName('Ebru', 'Alt‡nova')).resolves.toStrictEqual({
                    ok: true,
                    value: 'ealtnova',
                });
                emailServiceRepoMock.findByName.mockResolvedValueOnce(undefined);

                await expect(sut.generateName('‡re', 'Olsen')).resolves.toStrictEqual({
                    ok: true,
                    value: 'rolsen',
                });
            });
        });

        describe('when username cannot be generated (cleaned names are of length 0)', () => {
            it('should return error', async () => {
                emailServiceRepoMock.findByName.mockResolvedValueOnce(undefined);

                await expect(sut.generateName('‡‡', 'Mustermann')).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidNameError('Could not generate valid username'),
                });

                emailServiceRepoMock.findByName.mockResolvedValueOnce(undefined);

                await expect(sut.generateName('Alex', '‡‡')).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidNameError('Could not generate valid username'),
                });
            });
        });

        describe('when username exists', () => {
            it('should append and increase counter and return name', async () => {
                emailServiceRepoMock.findByName.mockResolvedValueOnce(createMock<Email<true>>()); //mock first attempt => maxmustermann already exists
                emailServiceRepoMock.findByName.mockResolvedValueOnce(createMock<Email<true>>()); //mock second attempt => maxmustermann1 already exists
                emailServiceRepoMock.findByName.mockResolvedValueOnce(undefined); //mock third attempt => maxmustermann2 not exists

                await expect(sut.generateName('Max', 'Mustermann')).resolves.toStrictEqual({
                    ok: true,
                    value: 'mmustermann2',
                });
            });
        });
    });
});
