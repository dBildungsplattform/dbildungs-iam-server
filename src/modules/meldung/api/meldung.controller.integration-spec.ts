import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { LoggingTestModule } from '../../../../test/utils/logging-test.module.js';
import { DatabaseTestModule, DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { MikroORM } from '@mikro-orm/core';
import { MeldungController } from './meldung.controller.js';
import { MeldungRepo } from '../persistence/meldung.repo.js';
import { MeldungModule } from '../meldung.module.js';
import { Meldung } from '../domain/meldung.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { MeldungResponse } from './meldung.response.js';
import { HttpException } from '@nestjs/common';
import { MeldungStatus } from '../persistence/meldung.entity.js';
import { CreateOrUpdateMeldungBodyParams } from './create-or-update-meldung.body.params.js';
import { faker } from '@faker-js/faker';

describe('Meldung Controller', () => {
    let module: TestingModule;
    let meldungController: MeldungController;
    let meldungRepo: DeepMocked<MeldungRepo>;
    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                LoggingTestModule,
                MapperTestModule,
                MeldungModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
            ],
            providers: [MeldungController, MeldungRepo],
        })
            .overrideProvider(MeldungRepo)
            .useValue(createMock<MeldungRepo>())
            .compile();

        await DatabaseTestModule.setupDatabase(module.get(MikroORM));

        meldungController = module.get(MeldungController);
        meldungRepo = module.get(MeldungRepo);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    afterAll(async () => {
        await module.get(MikroORM).close();
        await module.close();
    });

    it('should be defined', () => {
        expect(meldungController).toBeDefined();
        expect(meldungRepo).toBeDefined();
    });

    describe('get All Meldungen', () => {
        it('should return all meldungen if user has right permissions', async () => {
            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);
            const meldung: Meldung<true> = DoFactory.createMeldung(true);
            meldungRepo.findAll.mockResolvedValueOnce([meldung, meldung]);
            const response: MeldungResponse[] = await meldungController.getAllMeldungen(personpermissions);
            expect(response).toBeDefined();
            expect(response.length).toEqual(2);
        });

        it('should return all meldungen if user has right permissions', async () => {
            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(false);
            const meldung: Meldung<true> = DoFactory.createMeldung(true);
            meldungRepo.findAll.mockResolvedValueOnce([meldung]);
            await expect(meldungController.getAllMeldungen(personpermissions)).rejects.toThrow(HttpException);
        });
    });

    describe('get current Meldung', () => {
        it('should return current veroffentlich meldung', async () => {
            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);
            const meldung: Meldung<true> = DoFactory.createMeldung(true);
            meldung.status = MeldungStatus.VEROEFFENTLICHT;
            meldungRepo.findAll.mockResolvedValueOnce([meldung]);
            const response: MeldungResponse | null = await meldungController.getCurrentMeldunge();
            expect(response).toBeInstanceOf(MeldungResponse);
        });

        it('should return current veroffentlich meldung which was latest updated if multiple veroffentlicht meldungen exist', async () => {
            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);
            const meldung1: Meldung<true> = DoFactory.createMeldung(true);
            meldung1.status = MeldungStatus.VEROEFFENTLICHT;
            meldung1.updatedAt = new Date(2050, 6, 6);
            const meldung2: Meldung<true> = DoFactory.createMeldung(true);
            meldung2.status = MeldungStatus.VEROEFFENTLICHT;
            meldung2.updatedAt = new Date(2040, 6, 6);
            meldungRepo.findAll.mockResolvedValueOnce([meldung2, meldung1]);
            const response: MeldungResponse | null = await meldungController.getCurrentMeldunge();
            expect(response).toBeInstanceOf(MeldungResponse);
            expect(response?.updatedAt).toEqual(meldung1.updatedAt);
        });

        it('should return nothing if no current veroeffntlich meldung exists', async () => {
            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);
            const meldung: Meldung<true> = DoFactory.createMeldung(true);
            meldung.status = MeldungStatus.NICHT_VEROEFFENTLICHT;
            meldungRepo.findAll.mockResolvedValueOnce([meldung]);
            const response: MeldungResponse | null = await meldungController.getCurrentMeldunge();
            expect(response).toBeNull();
        });
    });

    describe('createOrUpdateMeldung', () => {
        describe('create', () => {
            it('should create meldung of id is empty', async () => {
                const personpermissions: DeepMocked<PersonPermissions> = createMock();
                personpermissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);
                const body: CreateOrUpdateMeldungBodyParams = {
                    inhalt: faker.string.alphanumeric(100),
                    status: MeldungStatus.VEROEFFENTLICHT,
                    revision: 1,
                };

                const meldung: Meldung<true> = DoFactory.createMeldung(true);
                meldung.inhalt = body.inhalt;
                meldung.status = body.status;
                meldung.revision = body.revision;

                meldungRepo.save.mockResolvedValueOnce(meldung);

                const response: MeldungResponse = await meldungController.createOrUpdateMeldung(
                    body,
                    personpermissions,
                );
                expect(response).toBeInstanceOf(MeldungResponse);
                expect(response.inhalt).toEqual(body.inhalt);
                expect(response.revision).toEqual(body.revision);
                expect(response.status).toEqual(body.status);
                expect(meldungRepo.save).toHaveBeenCalledTimes(1);
            });

            it('should fail if invalid inhalt', async () => {
                const personpermissions: DeepMocked<PersonPermissions> = createMock();
                personpermissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);
                const body: CreateOrUpdateMeldungBodyParams = {
                    inhalt: faker.string.alphanumeric(2001),
                    status: MeldungStatus.VEROEFFENTLICHT,
                    revision: 1,
                };

                await expect(meldungController.createOrUpdateMeldung(body, personpermissions)).rejects.toThrow(
                    HttpException,
                );
            });

            it('should fail if systemrechte are missing', async () => {
                const personpermissions: DeepMocked<PersonPermissions> = createMock();
                personpermissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(false);
                const body: CreateOrUpdateMeldungBodyParams = {
                    inhalt: faker.string.alphanumeric(100),
                    status: MeldungStatus.VEROEFFENTLICHT,
                    revision: 1,
                };

                await expect(meldungController.createOrUpdateMeldung(body, personpermissions)).rejects.toThrow(
                    HttpException,
                );
            });
        });
        describe('update', () => {
            it('should update meldung of id is provided', async () => {
                const personpermissions: DeepMocked<PersonPermissions> = createMock();
                personpermissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);
                const id: string = faker.string.uuid();
                const body: CreateOrUpdateMeldungBodyParams = {
                    id: id,
                    inhalt: faker.string.alphanumeric(100),
                    status: MeldungStatus.VEROEFFENTLICHT,
                    revision: 1,
                };

                const meldung: Meldung<true> = DoFactory.createMeldung(true);
                meldung.id = id;
                meldung.inhalt = faker.string.alphanumeric(100);
                meldung.status = body.status;
                meldung.revision = body.revision;

                meldungRepo.findById.mockResolvedValueOnce(meldung);
                meldungRepo.save.mockResolvedValueOnce(meldung);

                const response: MeldungResponse = await meldungController.createOrUpdateMeldung(
                    body,
                    personpermissions,
                );
                expect(response).toBeInstanceOf(MeldungResponse);
                expect(response.id).toEqual(id);
                expect(response.inhalt).toEqual(body.inhalt);
                expect(response.revision).toEqual(body.revision + 1);
                expect(response.status).toEqual(body.status);
                expect(meldungRepo.save).toHaveBeenCalledTimes(1);
            });

            it('should fail if invalid inhalt', async () => {
                const personpermissions: DeepMocked<PersonPermissions> = createMock();
                personpermissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);

                const id: string = faker.string.uuid();
                const body: CreateOrUpdateMeldungBodyParams = {
                    id: id,
                    inhalt: faker.string.alphanumeric(2001),
                    status: MeldungStatus.VEROEFFENTLICHT,
                    revision: 1,
                };

                const meldung: Meldung<true> = DoFactory.createMeldung(true);
                meldung.id = id;
                meldung.inhalt = faker.string.alphanumeric(100);
                meldung.status = body.status;
                meldung.revision = body.revision;

                meldungRepo.findById.mockResolvedValueOnce(meldung);

                await expect(meldungController.createOrUpdateMeldung(body, personpermissions)).rejects.toThrow(
                    HttpException,
                );
            });

            it('should fail if mismatched revision', async () => {
                const personpermissions: DeepMocked<PersonPermissions> = createMock();
                personpermissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);

                const id: string = faker.string.uuid();
                const body: CreateOrUpdateMeldungBodyParams = {
                    id: id,
                    inhalt: faker.string.alphanumeric(100),
                    status: MeldungStatus.VEROEFFENTLICHT,
                    revision: 10,
                };

                const meldung: Meldung<true> = DoFactory.createMeldung(true);
                meldung.id = id;
                meldung.inhalt = faker.string.alphanumeric(100);
                meldung.status = body.status;
                meldung.revision = 1;

                meldungRepo.findById.mockResolvedValueOnce(meldung);

                await expect(meldungController.createOrUpdateMeldung(body, personpermissions)).rejects.toThrow(
                    HttpException,
                );
            });

            it('should fail if existing merkmal not found', async () => {
                const personpermissions: DeepMocked<PersonPermissions> = createMock();
                personpermissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);

                const id: string = faker.string.uuid();
                const body: CreateOrUpdateMeldungBodyParams = {
                    id: id,
                    inhalt: faker.string.alphanumeric(100),
                    status: MeldungStatus.VEROEFFENTLICHT,
                    revision: 1,
                };

                meldungRepo.findById.mockResolvedValueOnce(undefined);

                await expect(meldungController.createOrUpdateMeldung(body, personpermissions)).rejects.toThrow(
                    HttpException,
                );
            });
        });
    });
});
