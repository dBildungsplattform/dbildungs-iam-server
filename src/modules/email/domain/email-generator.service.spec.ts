import { Test, TestingModule } from '@nestjs/testing';

import { EmailGeneratorService } from './email-generator.service.js';
import { faker } from '@faker-js/faker';
import {
    InvalidAttributeLengthError,
    InvalidCharacterSetError,
    InvalidNameError,
} from '../../../shared/error/index.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
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

    describe('isEqual', () => {
        describe('when internal error occurred', () => {
            it('should return false', () => {
                const res: boolean = sut.isEqual(
                    faker.string.alpha({ length: 10 }),
                    faker.string.alpha({ length: 32 }),
                    faker.string.alpha({ length: 32 }),
                );

                expect(res).toBeFalsy();
            });
        });

        describe('when address is NOT equal generated address', () => {
            it('should return false', () => {
                const vorname: string = 'theo';
                const familienname: string = 'meier';
                const address: string = faker.internet.email();
                emailServiceRepoMock.existsEmailAddress.mockResolvedValueOnce(false);

                const res: boolean = sut.isEqual(address, vorname, familienname);

                expect(res).toBeFalsy();
            });
        });

        describe('when address is equal generated address', () => {
            it('should return true', () => {
                const vorname: string = 'theo';
                const familienname: string = 'meier';
                const address: string = 'theo.meier@schule-sh.de';
                emailServiceRepoMock.existsEmailAddress.mockResolvedValueOnce(false);

                const res: boolean = sut.isEqual(address, vorname, familienname);

                expect(res).toBeTruthy();
            });
        });

        describe('when generated address is not ok', () => {
            it('should return false', () => {
                expect(sut.isEqual('test.test@schule-sh.de', '', '')).toBeFalsy();
            });
        });
    });

    describe('generateName', () => {
        describe('when firstname has less than 2 characters', () => {
            it('should return error', async () => {
                await expect(sut.generateAddress('', faker.string.alpha({ length: 2 }))).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidAttributeLengthError('name.vorname'),
                });
            });
        });

        describe('when lastname has less than 2 characters', () => {
            it('should return error', async () => {
                await expect(sut.generateAddress(faker.string.alpha({ length: 2 }), '')).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidAttributeLengthError('name.familienname'),
                });
            });
        });

        describe('when lastname consists of multiple names separated by hyphen', () => {
            it('should return valid email', async () => {
                emailServiceRepoMock.existsEmailAddress.mockResolvedValueOnce(false);

                await expect(sut.generateAddress('Paul', 'Müller-Meier')).resolves.toStrictEqual({
                    ok: true,
                    value: 'paul.mueller-meier@schule-sh.de',
                });
            });
        });

        describe('when first name consists of multiple names separated by hyphen', () => {
            it('should return valid email', async () => {
                emailServiceRepoMock.existsEmailAddress.mockResolvedValueOnce(false);

                await expect(sut.generateAddress('Paul-Edgar', 'Müller')).resolves.toStrictEqual({
                    ok: true,
                    value: 'paul-edgar.mueller@schule-sh.de',
                });
            });
        });

        describe('when first name consists of multiple names separated by space', () => {
            it('should return valid email', async () => {
                emailServiceRepoMock.existsEmailAddress.mockResolvedValueOnce(false);

                await expect(sut.generateAddress('Paul Edgar', 'Müller')).resolves.toStrictEqual({
                    ok: true,
                    value: 'pauledgar.mueller@schule-sh.de',
                });
            });
        });

        describe('when calculated address has more than 64 characters', () => {
            it('should return error', async () => {
                await expect(
                    sut.generateAddress(faker.string.alpha({ length: 32 }), faker.string.alpha({ length: 32 })),
                ).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidNameError('Could not generate valid username'),
                });
            });
        });

        describe('when firstname is not isDIN91379A', () => {
            it('should return error', async () => {
                await expect(sut.generateAddress('123^^$/()', 'Rottelburg')).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidCharacterSetError('name.vorname', 'DIN-91379A'),
                });
            });
        });

        describe('when lastname is not isDIN91379A', () => {
            it('should return error', async () => {
                await expect(sut.generateAddress('Torsten', '123^^$/()')).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidCharacterSetError('name.familienname', 'DIN-91379A'),
                });
            });
        });

        describe('when contains special characters', () => {
            it('should normalize german, danish and french special characters', async () => {
                emailServiceRepoMock.existsEmailAddress.mockResolvedValueOnce(false);
                await expect(sut.generateAddress('Åron', 'åàâçèéêëîïôùûÿäæöøœüß')).resolves.toStrictEqual({
                    ok: true,
                    value: 'aaron.aaaaceeeeiiouuyaeaeoeoeoeuess@schule-sh.de',
                });
            });
        });

        describe('when contains diacritics', () => {
            it('should remove diacritics', async () => {
                emailServiceRepoMock.existsEmailAddress.mockResolvedValueOnce(false);
                await expect(sut.generateAddress('Èlène', 'Lunâtiz')).resolves.toStrictEqual({
                    ok: true,
                    value: 'elene.lunatiz@schule-sh.de',
                });
            });
        });

        describe('when firstname contains invalid character set', () => {
            it('should not accept invalid character set in firstname', async () => {
                emailServiceRepoMock.existsEmailAddress.mockResolvedValueOnce(false);

                await expect(sut.generateAddress('Èlène?', 'L.,unâtiz')).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidCharacterSetError('name.vorname', 'DIN-91379A'),
                });
            });
        });

        describe('when lastname contains invalid character set', () => {
            it('should not accept invalid character set in lastname', async () => {
                emailServiceRepoMock.existsEmailAddress.mockResolvedValueOnce(false);

                await expect(sut.generateAddress('Èlène', 'L.,unâtiz?')).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidCharacterSetError('name.familienname', 'DIN-91379A'),
                });
            });
        });

        describe('when contains non-letters N1 (bnlreq)', () => {
            it('should remove non-letters N1 (bnlreq) chars', async () => {
                emailServiceRepoMock.existsEmailAddress.mockResolvedValueOnce(false);

                await expect(sut.generateAddress('Ebru', 'Alt‡nova')).resolves.toStrictEqual({
                    ok: true,
                    value: 'ebru.altnova@schule-sh.de',
                });
                emailServiceRepoMock.existsEmailAddress.mockResolvedValueOnce(false);

                await expect(sut.generateAddress('‡re', 'Olsen')).resolves.toStrictEqual({
                    ok: true,
                    value: 're.olsen@schule-sh.de',
                });
            });
        });

        describe('when username cannot be generated (cleaned names are of length 0)', () => {
            it('should return error', async () => {
                emailServiceRepoMock.existsEmailAddress.mockResolvedValueOnce(false);

                await expect(sut.generateAddress('‡‡', 'Mustermann')).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidNameError('Could not generate valid username'),
                });

                emailServiceRepoMock.existsEmailAddress.mockResolvedValueOnce(false);

                await expect(sut.generateAddress('Alex', '‡‡')).resolves.toStrictEqual({
                    ok: false,
                    error: new InvalidNameError('Could not generate valid username'),
                });
            });
        });

        describe('when username exists', () => {
            it('should append and increase counter and return name', async () => {
                emailServiceRepoMock.existsEmailAddress.mockResolvedValueOnce(true); //mock first attempt => maxmustermann already exists
                emailServiceRepoMock.existsEmailAddress.mockResolvedValueOnce(true); //mock second attempt => maxmustermann1 already exists
                emailServiceRepoMock.existsEmailAddress.mockResolvedValueOnce(false); //mock third attempt => maxmustermann2 not exists

                await expect(sut.generateAddress('Max', 'Mustermann')).resolves.toStrictEqual({
                    ok: true,
                    value: 'max.mustermann2@schule-sh.de',
                });
            });
        });
    });
});
