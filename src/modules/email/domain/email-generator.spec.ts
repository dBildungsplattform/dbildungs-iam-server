import { Test, TestingModule } from '@nestjs/testing';

import { faker } from '@faker-js/faker';
import {
    InvalidAttributeLengthError,
    InvalidCharacterSetError,
    InvalidNameError,
} from '../../../shared/error/index.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EmailGenerator } from './email-generator.js';
import { EmailRepo } from '../persistence/email.repo.js';

describe('EmailGenerator', () => {
    let module: TestingModule;
    let sut: EmailGenerator;
    let emailRepoMock: DeepMocked<EmailRepo>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                {
                    provide: EmailRepo,
                    useValue: createMock<EmailRepo>(),
                },
            ],
        }).compile();
        emailRepoMock = module.get(EmailRepo);
        sut = new EmailGenerator(emailRepoMock);
    });

    afterAll(async () => {
        await module.close();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('isEqual', () => {
        describe('when calculated address is not ok', () => {
            it('should return false', () => {
                expect(sut.isEqual('test.test@schule-sh.de', '', '')).toBeFalsy();
            });
        });

        describe('when calculated address is ok and not equal', () => {
            it('should return false', () => {
                expect(sut.isEqual('test.test@schule-sh.de', 'test1', 'test2')).toBeFalsy();
            });
        });

        describe('when calculated address is ok and equal', () => {
            it('should return true', () => {
                expect(sut.isEqual('test.test@schule-sh.de', 'test', 'test')).toBeTruthy();
            });
        });
    });

    describe('generateName', () => {
        describe('when firstname has less than 2 characters', () => {
            it('should return error', async () => {
                await expect(
                    sut.generateAvailableAddress('', faker.string.alpha({ length: 2 })),
                ).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidAttributeLengthError('name.vorname'),
                });
            });
        });

        describe('when lastname has less than 2 characters', () => {
            it('should return error', async () => {
                await expect(
                    sut.generateAvailableAddress(faker.string.alpha({ length: 2 }), ''),
                ).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidAttributeLengthError('name.familienname'),
                });
            });
        });

        describe('when lastname consists of multiple names separated by hyphen', () => {
            it('should return valid email', async () => {
                emailRepoMock.existsEmailAddress.mockResolvedValueOnce(false);

                await expect(sut.generateAvailableAddress('Paul', 'Müller-Meier')).resolves.toStrictEqual({
                    ok: true,
                    value: 'paul.mueller-meier@schule-sh.de',
                });
            });
        });

        describe('when first name consists of multiple names separated by hyphen', () => {
            it('should return valid email', async () => {
                emailRepoMock.existsEmailAddress.mockResolvedValueOnce(false);

                await expect(sut.generateAvailableAddress('Paul-Edgar', 'Müller')).resolves.toStrictEqual({
                    ok: true,
                    value: 'paul-edgar.mueller@schule-sh.de',
                });
            });
        });

        describe('when first name consists of multiple names separated by space', () => {
            it('should return valid email', async () => {
                emailRepoMock.existsEmailAddress.mockResolvedValueOnce(false);

                await expect(sut.generateAvailableAddress('Paul Edgar', 'Müller')).resolves.toStrictEqual({
                    ok: true,
                    value: 'pauledgar.mueller@schule-sh.de',
                });
            });
        });

        describe('when calculated address has more than 64 characters', () => {
            it('should return error', async () => {
                await expect(
                    sut.generateAvailableAddress(
                        faker.string.alpha({ length: 32 }),
                        faker.string.alpha({ length: 32 }),
                    ),
                ).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidNameError('Could not generate valid username'),
                });
            });
        });

        describe('when firstname is not isDIN91379A', () => {
            it('should return error', async () => {
                await expect(sut.generateAvailableAddress('123^^$/()', 'Rottelburg')).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidCharacterSetError('name.vorname', 'DIN-91379A'),
                });
            });
        });

        describe('when lastname is not isDIN91379A', () => {
            it('should return error', async () => {
                await expect(sut.generateAvailableAddress('Torsten', '123^^$/()')).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidCharacterSetError('name.familienname', 'DIN-91379A'),
                });
            });
        });

        describe('when contains special characters', () => {
            it('should normalize german, danish and french special characters', async () => {
                emailRepoMock.existsEmailAddress.mockResolvedValueOnce(false);
                await expect(sut.generateAvailableAddress('Åron', 'åàâçèéêëîïôùûÿäæöøœüß')).resolves.toStrictEqual({
                    ok: true,
                    value: 'aaron.aaaaceeeeiiouuyaeaeoeoeoeuess@schule-sh.de',
                });
            });
        });

        describe('when contains diacritics', () => {
            it('should remove diacritics', async () => {
                emailRepoMock.existsEmailAddress.mockResolvedValueOnce(false);
                await expect(sut.generateAvailableAddress('Èlène', 'Lunâtiz')).resolves.toStrictEqual({
                    ok: true,
                    value: 'elene.lunatiz@schule-sh.de',
                });
            });
        });

        describe('when firstname contains invalid character set', () => {
            it('should not accept invalid character set in firstname', async () => {
                emailRepoMock.existsEmailAddress.mockResolvedValueOnce(false);

                await expect(sut.generateAvailableAddress('Èlène?', 'L.,unâtiz')).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidCharacterSetError('name.vorname', 'DIN-91379A'),
                });
            });
        });

        describe('when lastname contains invalid character set', () => {
            it('should not accept invalid character set in lastname', async () => {
                emailRepoMock.existsEmailAddress.mockResolvedValueOnce(false);

                await expect(sut.generateAvailableAddress('Èlène', 'L.,unâtiz?')).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidCharacterSetError('name.familienname', 'DIN-91379A'),
                });
            });
        });

        describe('when contains non-letters N1 (bnlreq)', () => {
            it('should remove non-letters N1 (bnlreq) chars', async () => {
                emailRepoMock.existsEmailAddress.mockResolvedValueOnce(false);

                await expect(sut.generateAvailableAddress('Ebru', 'Alt‡nova')).resolves.toStrictEqual({
                    ok: true,
                    value: 'ebru.altnova@schule-sh.de',
                });
                emailRepoMock.existsEmailAddress.mockResolvedValueOnce(false);

                await expect(sut.generateAvailableAddress('‡re', 'Olsen')).resolves.toStrictEqual({
                    ok: true,
                    value: 're.olsen@schule-sh.de',
                });
            });
        });

        describe('when username cannot be generated (cleaned names are of length 0)', () => {
            it('should return error', async () => {
                emailRepoMock.existsEmailAddress.mockResolvedValueOnce(false);

                await expect(sut.generateAvailableAddress('‡‡', 'Mustermann')).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidNameError('Could not generate valid username'),
                });

                emailRepoMock.existsEmailAddress.mockResolvedValueOnce(false);

                await expect(sut.generateAvailableAddress('Alex', '‡‡')).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidNameError('Could not generate valid username'),
                });
            });
        });

        describe('when username exists', () => {
            it('should append and increase counter and return name', async () => {
                emailRepoMock.existsEmailAddress.mockResolvedValueOnce(true); //mock first attempt => maxmustermann already exists
                emailRepoMock.existsEmailAddress.mockResolvedValueOnce(true); //mock second attempt => maxmustermann1 already exists
                emailRepoMock.existsEmailAddress.mockResolvedValueOnce(false); //mock third attempt => maxmustermann2 not exists

                await expect(sut.generateAvailableAddress('Max', 'Mustermann')).resolves.toStrictEqual({
                    ok: true,
                    value: 'max.mustermann2@schule-sh.de',
                });
            });
        });
    });
});
