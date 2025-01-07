import { faker } from '@faker-js/faker';
import * as fs from 'fs';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { CallHandler, ExecutionContext, INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { App } from 'supertest/types.js';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DoFactory,
    KeycloakConfigTestModule,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';
import { OrganisationEntity } from '../../organisation/persistence/organisation.entity.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { PersonPermissionsRepo } from '../../authentication/domain/person-permission.repo.js';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { PassportUser } from '../../authentication/types/user.js';

import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';

import { KeycloakUserService } from '../../keycloak-administration/domain/keycloak-user.service.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { KeycloakConfigModule } from '../../keycloak-administration/keycloak-config.module.js';
import { ImportApiModule } from '../import-api.module.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import path from 'path';
import { ImportDataRepository } from '../persistence/import-data.repository.js';
import { ImportvorgangByIdBodyParams } from './importvorgang-by-id.body.params.js';
import { ImportDataItem } from '../domain/import-data-item.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { ImportVorgangRepository } from '../persistence/import-vorgang.repository.js';
import { ImportVorgang } from '../domain/import-vorgang.js';
import { PagedResponse } from '../../../shared/paging/paged.response.js';
import { ImportVorgangResponse } from './importvorgang.response.js';
import { ImportStatus } from '../domain/import.enums.js';
import { StepUpGuard } from '../../authentication/api/steup-up.guard.js';
import { KeycloakAdministrationService } from '../../keycloak-administration/domain/keycloak-admin-client.service.js';
import { ImportVorgangStatusResponse } from './importvorgang-status.response.js';
import { PersonEntity } from '../../person/persistence/person.entity.js';
import { mapAggregateToData } from '../../person/persistence/person.repository.js';
import { ImportDataItemStatus } from '../domain/importDataItem.enum.js';

describe('Import API', () => {
    let app: INestApplication;
    let orm: MikroORM;
    let em: EntityManager;
    let rolleRepo: RolleRepo;
    let importDataRepository: ImportDataRepository;
    let importVorgangRepository: ImportVorgangRepository;
    let personpermissionsRepoMock: DeepMocked<PersonPermissionsRepo>;
    let personPermissionsMock: DeepMocked<PersonPermissions>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ImportApiModule,
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                MapperTestModule,
            ],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                {
                    provide: APP_INTERCEPTOR,
                    useValue: {
                        intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
                            const req: Request = context.switchToHttp().getRequest();
                            req.passportUser = createMock<PassportUser>({
                                async personPermissions() {
                                    return personpermissionsRepoMock.loadPersonPermissions('');
                                },
                            });
                            return next.handle();
                        },
                    },
                },
                {
                    provide: PersonPermissionsRepo,
                    useValue: createMock<PersonPermissionsRepo>(),
                },
                {
                    provide: KeycloakUserService,
                    useValue: createMock<KeycloakUserService>({
                        create: () =>
                            Promise.resolve({
                                ok: true,
                                value: faker.string.uuid(),
                            }),
                        setPassword: () =>
                            Promise.resolve({
                                ok: true,
                                value: faker.string.alphanumeric(16),
                            }),
                    }),
                },
                {
                    provide: KeycloakAdministrationService,
                    useValue: createMock<KeycloakAdministrationService>({
                        getAuthedKcAdminClient: () =>
                            Promise.resolve({
                                ok: true,
                                value: createMock(),
                            }),
                    }),
                },
            ],
        })
            .overrideModule(KeycloakConfigModule)
            .useModule(KeycloakConfigTestModule.forRoot({ isKeycloakRequired: true }))
            .compile();

        const stepUpGuard: StepUpGuard = module.get(StepUpGuard);
        stepUpGuard.canActivate = jest.fn().mockReturnValue(true);

        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        rolleRepo = module.get(RolleRepo);
        importDataRepository = module.get(ImportDataRepository);
        personpermissionsRepoMock = module.get(PersonPermissionsRepo);
        importVorgangRepository = module.get(ImportVorgangRepository);

        personPermissionsMock = createMock<PersonPermissions>();
        personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personPermissionsMock);
        personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [] });
        personPermissionsMock.personFields.username = faker.internet.userName();

        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
        app = module.createNestApplication();
        await app.init();
    }, 10000000);

    afterAll(async () => {
        await orm.close();
        await app.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    describe('/POST upload', () => {
        it('should return 201 OK with ImportUploadResponse', async () => {
            const filePath: string = path.resolve('./', `test/imports/valid_test_import_SuS.csv`);

            const fileExists: boolean = fs.existsSync(filePath);
            if (!fileExists) throw new Error('file does not exist');

            const schule: OrganisationEntity = new OrganisationEntity();
            schule.typ = OrganisationsTyp.SCHULE;
            schule.name = 'Import Schule';
            await em.persistAndFlush(schule);
            await em.findOneOrFail(OrganisationEntity, { id: schule.id });

            const klasse1A: OrganisationEntity = new OrganisationEntity();
            klasse1A.typ = OrganisationsTyp.KLASSE;
            klasse1A.name = '1a';
            klasse1A.administriertVon = schule.id;
            klasse1A.zugehoerigZu = schule.id;
            await em.persistAndFlush(klasse1A);
            await em.findOneOrFail(OrganisationEntity, { id: klasse1A.id });

            const klasse2B: OrganisationEntity = new OrganisationEntity();
            klasse2B.typ = OrganisationsTyp.KLASSE;
            klasse2B.name = '2b';
            klasse2B.administriertVon = schule.id;
            klasse2B.zugehoerigZu = schule.id;
            await em.persistAndFlush(klasse2B);
            await em.findOneOrFail(OrganisationEntity, { id: klasse2B.id });

            const sus: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    rollenart: RollenArt.LERN,
                    administeredBySchulstrukturknoten: schule.id,
                }),
            );
            if (sus instanceof DomainError) throw sus;

            const response: Response = await request(app.getHttpServer() as App)
                .post('/import/upload')
                .set('content-type', 'multipart/form-data')
                .field('organisationId', schule.id)
                .field('rolleId', sus.id)
                .attach('file', filePath);

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                importvorgangId: expect.any(String) as unknown as string,
                isValid: true,
                totalImportDataItems: 2,
                totalInvalidImportDataItems: 0,
                invalidImportDataItems: [],
            });
        });

        it('should return 201 OK with ImportUploadResponse when there are missing values in the data items', async () => {
            const filePath: string = path.resolve('./', `test/imports/valid_with_empty_values_test_import_SuS.csv`);

            const fileExists: boolean = fs.existsSync(filePath);
            if (!fileExists) throw new Error('file does not exist');

            const schule: OrganisationEntity = new OrganisationEntity();
            schule.typ = OrganisationsTyp.SCHULE;
            schule.name = 'Import Schule';
            await em.persistAndFlush(schule);
            await em.findOneOrFail(OrganisationEntity, { id: schule.id });

            const klasse1A: OrganisationEntity = new OrganisationEntity();
            klasse1A.typ = OrganisationsTyp.KLASSE;
            klasse1A.name = '1A';
            klasse1A.administriertVon = schule.id;
            klasse1A.zugehoerigZu = schule.id;
            await em.persistAndFlush(klasse1A);
            await em.findOneOrFail(OrganisationEntity, { id: klasse1A.id });

            const sus: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    rollenart: RollenArt.LERN,
                    administeredBySchulstrukturknoten: schule.id,
                }),
            );
            if (sus instanceof DomainError) throw sus;

            const response: Response = await request(app.getHttpServer() as App)
                .post('/import/upload')
                .set('content-type', 'multipart/form-data')
                .field('organisationId', schule.id)
                .field('rolleId', sus.id)
                .attach('file', filePath);

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                importvorgangId: expect.any(String) as unknown as string,
                isValid: false,
                totalImportDataItems: 2,
                totalInvalidImportDataItems: 2,
                invalidImportDataItems: [
                    {
                        vorname: '',
                        nachname: 'Mustermann',
                        klasse: '1a',
                        validationErrors: [
                            'IMPORT_DATA_ITEM_VORNAME_IS_TOO_SHORT',
                            'IMPORT_DATA_ITEM_KLASSE_NOT_FOUND',
                        ],
                    },
                    {
                        vorname: 'Maria',
                        nachname: '',
                        klasse: '',
                        validationErrors: [
                            'IMPORT_DATA_ITEM_NACHNAME_IS_TOO_SHORT',
                            'IMPORT_DATA_ITEM_KLASSE_IS_TOO_SHORT',
                        ],
                    },
                ],
            });
        });

        it('should return 404 if the organisation is not found', async () => {
            const filePath: string = path.resolve('./', `test/imports/valid_test_import_SuS.csv`);

            const fileExists: boolean = fs.existsSync(filePath);
            if (!fileExists) throw new Error('file does not exist');

            const response: Response = await request(app.getHttpServer() as App)
                .post('/import/upload')
                .set('content-type', 'multipart/form-data')
                .field('organisationId', faker.string.uuid())
                .field('rolleId', faker.string.uuid())
                .attach('file', filePath);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                code: 404,
                subcode: '01',
                titel: 'Angefragte Entität existiert nicht',
                beschreibung: 'Die angeforderte Entität existiert nicht',
            });
        });

        it('should return 400 with CSV_PARSING_ERROR if the csv file can be parsed but has data items errors', async () => {
            const filePath: string = path.resolve('./', `test/imports/invalid_test_import_SuS.csv`);

            const fileExists: boolean = fs.existsSync(filePath);
            if (!fileExists) throw new Error('file does not exist');

            const schule: OrganisationEntity = new OrganisationEntity();
            schule.typ = OrganisationsTyp.SCHULE;
            await em.persistAndFlush(schule);
            await em.findOneOrFail(OrganisationEntity, { id: schule.id });

            const sus: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    rollenart: RollenArt.LERN,
                    administeredBySchulstrukturknoten: schule.id,
                }),
            );
            if (sus instanceof DomainError) throw sus;

            const response: Response = await request(app.getHttpServer() as App)
                .post('/import/upload')
                .set('content-type', 'multipart/form-data')
                .field('organisationId', schule.id)
                .field('rolleId', sus.id)
                .attach('file', filePath);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                code: 400,
                i18nKey: 'CSV_PARSING_ERROR',
            });
        });

        it('should return 400 with CSV_PARSING_ERROR if the csv file is empty', async () => {
            const filePath: string = path.resolve('./', `test/imports/empty_test_import_SuS.csv`);

            const fileExists: boolean = fs.existsSync(filePath);
            if (!fileExists) throw new Error('file does not exist');

            const schule: OrganisationEntity = new OrganisationEntity();
            schule.typ = OrganisationsTyp.SCHULE;
            await em.persistAndFlush(schule);
            await em.findOneOrFail(OrganisationEntity, { id: schule.id });

            const sus: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    rollenart: RollenArt.LERN,
                    administeredBySchulstrukturknoten: schule.id,
                }),
            );
            if (sus instanceof DomainError) throw sus;

            const response: Response = await request(app.getHttpServer() as App)
                .post('/import/upload')
                .set('content-type', 'multipart/form-data')
                .field('organisationId', schule.id)
                .field('rolleId', sus.id)
                .attach('file', filePath);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                code: 400,
                i18nKey: 'CSV_FILE_EMPTY_ERROR',
            });
        });

        it('should return 400 if the file mime type is not csv', async () => {
            const filePath: string = path.resolve('./', `test/imports/invalid_filetype_test_import.txt`);

            const fileExists: boolean = fs.existsSync(filePath);
            if (!fileExists) throw new Error('file does not exist');

            const response: Response = await request(app.getHttpServer() as App)
                .post('/import/upload')
                .set('content-type', 'multipart/form-data')
                .field('organisationId', faker.string.uuid())
                .field('rolleId', faker.string.uuid())
                .attach('file', filePath);

            expect(response.status).toBe(400);
        });

        it('should return 400 with CSV_FILE_INVALID_HEADER_ERROR if the csv file has an invalid header', async () => {
            const filePath: string = path.resolve('./', `test/imports/invalid_klasse_header_import_SuS.csv`);

            const fileExists: boolean = fs.existsSync(filePath);
            if (!fileExists) throw new Error('file does not exist');

            const schule: OrganisationEntity = new OrganisationEntity();
            schule.typ = OrganisationsTyp.SCHULE;
            await em.persistAndFlush(schule);
            await em.findOneOrFail(OrganisationEntity, { id: schule.id });

            const sus: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    rollenart: RollenArt.LERN,
                    administeredBySchulstrukturknoten: schule.id,
                }),
            );
            if (sus instanceof DomainError) throw sus;

            const response: Response = await request(app.getHttpServer() as App)
                .post('/import/upload')
                .set('content-type', 'multipart/form-data')
                .field('organisationId', schule.id)
                .field('rolleId', sus.id)
                .attach('file', filePath);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                code: 400,
                i18nKey: 'CSV_FILE_INVALID_HEADER_ERROR',
            });
        });

        it('should return 400 if the file mime type is excel and the file content is correct', async () => {
            const filePath: string = path.resolve('./', `test/imports/invalid_filetype_excel.xlsx`);

            const fileExists: boolean = fs.existsSync(filePath);
            if (!fileExists) throw new Error('file does not exist');

            const response: Response = await request(app.getHttpServer() as App)
                .post('/import/upload')
                .set('content-type', 'multipart/form-data')
                .field('organisationId', faker.string.uuid())
                .field('rolleId', faker.string.uuid())
                .attach('file', filePath);

            expect(response.status).toBe(400);
            expect((response.body as { message: string }).message).toEqual(
                'Validation failed (expected type is text/csv|application/vnd.ms-excel)',
            );
        });

        it('should return 201 OK with ImportUploadResponse if the CSV file has the mime type application/vnd.ms-excel due to firefox', async () => {
            const filePath: string = path.resolve('./', `test/imports/valid_test_import_SuS_type_MsExcel.csv`);

            const fileExists: boolean = fs.existsSync(filePath);
            if (!fileExists) throw new Error('file does not exist');

            const schule: OrganisationEntity = new OrganisationEntity();
            schule.typ = OrganisationsTyp.SCHULE;
            schule.name = 'Import Schule';
            await em.persistAndFlush(schule);
            await em.findOneOrFail(OrganisationEntity, { id: schule.id });

            const klasse1A: OrganisationEntity = new OrganisationEntity();
            klasse1A.typ = OrganisationsTyp.KLASSE;
            klasse1A.name = '1a';
            klasse1A.administriertVon = schule.id;
            klasse1A.zugehoerigZu = schule.id;
            await em.persistAndFlush(klasse1A);
            await em.findOneOrFail(OrganisationEntity, { id: klasse1A.id });

            const sus: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    rollenart: RollenArt.LERN,
                    administeredBySchulstrukturknoten: schule.id,
                }),
            );

            if (sus instanceof DomainError) throw sus;

            const response: Response = await request(app.getHttpServer() as App)
                .post('/import/upload')
                .set('content-type', 'multipart/form-data')
                .field('organisationId', schule.id)
                .field('rolleId', sus.id)
                .attach('file', filePath, { contentType: 'application/vnd.ms-excel' });

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                importvorgangId: expect.any(String) as unknown as string,
                isValid: true,
                totalImportDataItems: 1,
                totalInvalidImportDataItems: 0,
                invalidImportDataItems: [],
            });
        });

        it('should return 404 if the logged-in admin has no username', async () => {
            const filePath: string = path.resolve('./', `test/imports/valid_test_import_SuS.csv`);

            const fileExists: boolean = fs.existsSync(filePath);
            if (!fileExists) throw new Error('file does not exist');

            const schule: OrganisationEntity = new OrganisationEntity();
            schule.typ = OrganisationsTyp.SCHULE;
            schule.name = 'Import Schule';
            await em.persistAndFlush(schule);
            await em.findOneOrFail(OrganisationEntity, { id: schule.id });

            const klasse: OrganisationEntity = new OrganisationEntity();
            klasse.typ = OrganisationsTyp.KLASSE;
            klasse.name = '1a';
            klasse.administriertVon = schule.id;
            klasse.zugehoerigZu = schule.id;
            await em.persistAndFlush(klasse);
            await em.findOneOrFail(OrganisationEntity, { id: klasse.id });

            const sus: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    rollenart: RollenArt.LERN,
                    administeredBySchulstrukturknoten: schule.id,
                    merkmale: [],
                }),
            );
            if (sus instanceof DomainError) throw sus;

            personPermissionsMock.personFields.username = undefined;

            const response: Response = await request(app.getHttpServer() as App)
                .post('/import/upload')
                .set('content-type', 'multipart/form-data')
                .field('organisationId', schule.id)
                .field('rolleId', sus.id)
                .attach('file', filePath);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                code: 404,
                subcode: '01',
                titel: 'Angefragte Entität existiert nicht',
                beschreibung: 'Die angeforderte Entität existiert nicht',
            });
        });
    });

    describe('/POST execute', () => {
        it('should return 204 No Content', async () => {
            const schule: OrganisationEntity = new OrganisationEntity();
            schule.typ = OrganisationsTyp.SCHULE;
            schule.name = 'Import Schule';
            await em.persistAndFlush(schule);
            await em.findOneOrFail(OrganisationEntity, { id: schule.id });

            const klasse: OrganisationEntity = new OrganisationEntity();
            klasse.typ = OrganisationsTyp.KLASSE;
            klasse.name = '1a';
            klasse.administriertVon = schule.id;
            klasse.zugehoerigZu = schule.id;
            await em.persistAndFlush(klasse);
            await em.findOneOrFail(OrganisationEntity, { id: klasse.id });

            const klasse1A: OrganisationEntity = new OrganisationEntity();
            klasse1A.typ = OrganisationsTyp.KLASSE;
            klasse1A.name = '1A';
            klasse1A.administriertVon = schule.id;
            klasse1A.zugehoerigZu = schule.id;
            await em.persistAndFlush(klasse1A);
            await em.findOneOrFail(OrganisationEntity, { id: klasse1A.id });

            const sus: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    rollenart: RollenArt.LERN,
                    administeredBySchulstrukturknoten: schule.id,
                    merkmale: [],
                }),
            );
            if (sus instanceof DomainError) throw sus;

            const person: PersonEntity = em.create(PersonEntity, mapAggregateToData(DoFactory.createPerson(false)));
            await em.persistAndFlush(person);
            await em.findOneOrFail(PersonEntity, { id: person.id });

            const importVorgang: ImportVorgang<true> = await importVorgangRepository.save(
                DoFactory.createImportVorgang(false, {
                    organisationId: schule.id,
                    rolleId: sus.id,
                    importByPersonId: person.id,
                }),
            );
            await importDataRepository.save(
                DoFactory.createImportDataItem(false, {
                    importvorgangId: importVorgang.id,
                    klasse: klasse.name,
                    personalnummer: undefined,
                }),
            );

            const params: ImportvorgangByIdBodyParams = {
                importvorgangId: importVorgang.id,
            };

            const response: Response = await request(app.getHttpServer() as App)
                .post('/import/execute')
                .send(params);

            expect(response.status).toBe(204);
        });

        it('should return 404 if the import transaction is not found', async () => {
            const params: ImportvorgangByIdBodyParams = {
                importvorgangId: faker.string.uuid(),
            };

            const executeResponse: Response = await request(app.getHttpServer() as App)
                .post('/import/execute')
                .send(params);

            expect(executeResponse.status).toBe(404);
        });

        it('should return 500 if the import vorgang has no organisation ID', async () => {
            const sus: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    rollenart: RollenArt.LERN,
                    merkmale: [],
                }),
            );
            if (sus instanceof DomainError) throw sus;
            const importVorgang: ImportVorgang<true> = await importVorgangRepository.save(
                DoFactory.createImportVorgang(false, {
                    organisationId: undefined,
                    rolleId: sus.id,
                    importByPersonId: undefined,
                }),
            );
            const params: ImportvorgangByIdBodyParams = {
                importvorgangId: importVorgang.id,
            };

            const executeResponse: Response = await request(app.getHttpServer() as App)
                .post('/import/execute')
                .send(params);

            expect(executeResponse.status).toBe(500);
        });
    });

    describe('/GET doownload', () => {
        it('should return 200 OK with the file', async () => {
            const schule: OrganisationEntity = new OrganisationEntity();
            schule.typ = OrganisationsTyp.SCHULE;
            schule.name = 'Import Schule';
            await em.persistAndFlush(schule);
            await em.findOneOrFail(OrganisationEntity, { id: schule.id });

            const klasse: OrganisationEntity = new OrganisationEntity();
            klasse.typ = OrganisationsTyp.KLASSE;
            klasse.name = '1a';
            klasse.administriertVon = schule.id;
            klasse.zugehoerigZu = schule.id;
            await em.persistAndFlush(klasse);
            await em.findOneOrFail(OrganisationEntity, { id: klasse.id });

            const sus: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    rollenart: RollenArt.LERN,
                    administeredBySchulstrukturknoten: schule.id,
                    merkmale: [],
                }),
            );
            if (sus instanceof DomainError) throw sus;

            const importVorgang: ImportVorgang<true> = await importVorgangRepository.save(
                DoFactory.createImportVorgang(false, {
                    organisationId: schule.id,
                    rolleId: sus.id,
                    importByPersonId: undefined,
                    status: ImportStatus.FINISHED,
                }),
            );

            const importDataItem: ImportDataItem<true> = await importDataRepository.save(
                DoFactory.createImportDataItem(false, {
                    importvorgangId: importVorgang.id,
                    klasse: klasse.name,
                    personalnummer: undefined,
                    username: faker.internet.userName(),
                    password: '5ba56bceb34c5b84|6ad72f7a8fa8d98daa7e3f0dc6aa2a82',
                    status: ImportDataItemStatus.SUCCESS,
                }),
            );

            const response: Response = await request(app.getHttpServer() as App)
                .get(`/import/${importVorgang.id}/download`)
                .send();

            expect(response.status).toBe(200);
            expect(response.type).toBe('text/plain');

            const resultString: string = response.text;
            expect(resultString).toContain(schule.name);
            expect(resultString).toContain(sus.name);
            expect(resultString).toContain(importDataItem.vorname);
            expect(resultString).toContain(importDataItem.nachname);
            expect(resultString).toContain(klasse.name);
        });

        it('should return 404 if the import transaction is not found', async () => {
            const executeResponse: Response = await request(app.getHttpServer() as App)
                .get(`/import/${faker.string.uuid()}/download`)
                .send();

            expect(executeResponse.status).toBe(404);
        });
    });

    describe('/DELETE deleteImportTransaction', () => {
        it('should return 204', async () => {
            const importVorgang: ImportVorgang<true> = await importVorgangRepository.save(
                DoFactory.createImportVorgang(false, {
                    importByPersonId: undefined,
                    rolleId: undefined,
                    organisationId: undefined,
                }),
            );
            await importDataRepository.save(
                DoFactory.createImportDataItem(false, {
                    importvorgangId: importVorgang.id,
                    klasse: faker.lorem.word(),
                    personalnummer: undefined,
                }),
            );

            const response: Response = await request(app.getHttpServer() as App)
                .delete(`/import/${importVorgang.id}`)
                .send();

            expect(response.status).toBe(204);
        });
    });

    describe('/GET history', () => {
        let rolleId: string = faker.string.uuid();
        let orgaId1: string = faker.string.uuid();
        let orgaId2: string = faker.string.uuid();

        beforeEach(async () => {
            const schule: OrganisationEntity = new OrganisationEntity();
            schule.typ = OrganisationsTyp.SCHULE;
            schule.name = 'Import Schule';
            await em.persistAndFlush(schule);
            await em.findOneOrFail(OrganisationEntity, { id: schule.id });
            orgaId1 = schule.id;

            const schule2: OrganisationEntity = new OrganisationEntity();
            schule2.typ = OrganisationsTyp.SCHULE;
            await em.persistAndFlush(schule2);
            await em.findOneOrFail(OrganisationEntity, { id: schule2.id });
            orgaId2 = schule2.id;

            const sus: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    rollenart: RollenArt.LERN,
                    administeredBySchulstrukturknoten: schule.id,
                    merkmale: [],
                }),
            );
            if (sus instanceof DomainError) throw sus;

            rolleId = sus.id;

            await Promise.all([
                importVorgangRepository.save(
                    DoFactory.createImportVorgang(false, {
                        organisationId: orgaId1,
                        importByPersonId: undefined,
                        rolleId: undefined,
                    }),
                ),
                importVorgangRepository.save(
                    DoFactory.createImportVorgang(false, {
                        rolleId: rolleId,
                        organisationId: orgaId2,
                        importByPersonId: undefined,
                    }),
                ),
            ]);
        });

        it('should return empty array when admin des not have IMPORT_DURCHFUEHREN rights', async () => {
            personPermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(false);

            const response: Response = await request(app.getHttpServer() as App)
                .get('/import/history')
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
            const pagedResponse: PagedResponse<ImportVorgangResponse> =
                response.body as PagedResponse<ImportVorgangResponse>;
            expect(pagedResponse.items).toHaveLength(0);
        });

        it('should return all import transactions', async () => {
            personPermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);

            const response: Response = await request(app.getHttpServer() as App)
                .get('/import/history')
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
            const pagedResponse: PagedResponse<ImportVorgangResponse> =
                response.body as PagedResponse<ImportVorgangResponse>;
            expect(pagedResponse.items).toHaveLength(2);
        });

        it('should return import history when search by rolleIds', async () => {
            personPermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);

            const response: Response = await request(app.getHttpServer() as App)
                .get('/import/history')
                .query({ rolleIds: [rolleId] })
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
            const pagedResponse: PagedResponse<ImportVorgangResponse> =
                response.body as PagedResponse<ImportVorgangResponse>;
            expect(pagedResponse.items).toHaveLength(1);
        });

        it('should return import history when search by organisationIds', async () => {
            personPermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);

            const response: Response = await request(app.getHttpServer() as App)
                .get('/import/history')
                .query({ organisationIds: [orgaId1, orgaId2] })
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
            const pagedResponse: PagedResponse<ImportVorgangResponse> =
                response.body as PagedResponse<ImportVorgangResponse>;
            expect(pagedResponse.items).toHaveLength(2);
        });

        it('should return import history when search by status', async () => {
            personPermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(true);
            const startedImport: ImportVorgang<true> = await importVorgangRepository.save(
                DoFactory.createImportVorgang(false, {
                    importByPersonId: undefined,
                    rolleId: undefined,
                    organisationId: undefined,
                }),
            );
            startedImport.status = ImportStatus.COMPLETED;
            await importVorgangRepository.save(startedImport);

            const response: Response = await request(app.getHttpServer() as App)
                .get('/import/history')
                .query({ status: ImportStatus.COMPLETED })
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
            const pagedResponse: PagedResponse<ImportVorgangResponse> =
                response.body as PagedResponse<ImportVorgangResponse>;
            expect(pagedResponse.items).toHaveLength(1);
        });
    });

    describe('/GET importstatus by id', () => {
        it('should return 200 OK with import status', async () => {
            const importVorgang: ImportVorgang<true> = await importVorgangRepository.save(
                DoFactory.createImportVorgang(false, {
                    status: ImportStatus.COMPLETED,
                    importByPersonId: undefined,
                    rolleId: undefined,
                    organisationId: undefined,
                }),
            );

            const response: Response = await request(app.getHttpServer() as App)
                .get(`/import/${importVorgang.id}/status`)
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
            expect(response.body).toEqual({
                dataItemCount: 100,
                status: ImportStatus.COMPLETED,
                totalDataItemImported: 0,
            } as ImportVorgangStatusResponse);
        });

        it('should return 404 if importvorgang does not exist', async () => {
            const response: Response = await request(app.getHttpServer() as App)
                .get(`/import/${faker.string.uuid()}/status`)
                .send();

            expect(response.status).toBe(404);
        });
    });
});
