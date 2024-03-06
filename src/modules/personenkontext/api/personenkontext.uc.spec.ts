import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { Paged } from '../../../shared/paging/paged.js';
import { PersonDo } from '../../person/domain/person.do.js';
import { PersonService } from '../../person/domain/person.service.js';
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { Personenstatus, Rolle, SichtfreigabeType } from '../domain/personenkontext.enums.js';
import { PersonenkontextService } from '../domain/personenkontext.service.js';
import { CreatePersonenkontextDto } from './create-personenkontext.dto.js';
import { CreatedPersonenkontextDto } from './created-personenkontext.dto.js';
import { FindPersonenkontextByIdDto } from './find-personenkontext-by-id.dto.js';
import { FindPersonenkontextDto } from './find-personenkontext.dto.js';
import { PersonApiMapperProfile } from '../../person/api/person-api.mapper.profile.js';
import { PersonenkontextDto } from './personenkontext.dto.js';
import { PersonenkontextUc } from './personenkontext.uc.js';
import { PersonendatensatzDto } from '../../person/api/personendatensatz.dto.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { DeletePersonenkontextDto } from './delete-personkontext.dto.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { DBiamPersonenkontextRepo } from '../dbiam/dbiam-personenkontext.repo.js';
import { FindPersonenkontextRollenBodyParams } from './find-personenkontext-rollen.body.params.js';
import { PersonenkontextAnlage } from '../domain/personenkontext-anlage.js';
import { FindRollenResponse } from './find-rollen.response.js';
import { FindSchulstrukturknotenResponse } from './find-schulstrukturknoten.response.js';
import { FindPersonenkontextSchulstrukturknotenBodyParams } from './find-personenkontext-schulstrukturknoten.body.params.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { RollenArt, RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { Rolle as RolleAggregate } from '../../rolle/domain/rolle.js';
import { SystemrechtResponse } from './personenkontext-systemrecht.response.js';
import { OrganisationService } from '../../organisation/domain/organisation.service.js';
import { OrganisationApiMapperProfile } from '../../organisation/api/organisation-api.mapper.profile.js';

function createPersonenkontext(): Personenkontext<true>[] {
    return [
        {
            id: '1',
            personId: '1',
            rolleId: '1',
            organisationId: '1',
            createdAt: faker.date.past(),
            updatedAt: faker.date.recent(),
        },
    ];
}

function createRolle(): RolleAggregate<true> {
    return RolleAggregate.construct('1', faker.date.past(), faker.date.recent(), 'Rolle1', '1', RollenArt.LEHR, [], []);
}

describe('PersonenkontextUc', () => {
    let module: TestingModule;
    let sut: PersonenkontextUc;
    let personServiceMock: DeepMocked<PersonService>;
    let personenkontextServiceMock: DeepMocked<PersonenkontextService>;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let organisationRepoMock: DeepMocked<OrganisationRepo>;
    let dbiamPersonenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let organisationServiceMock: DeepMocked<OrganisationService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                PersonenkontextUc,
                PersonApiMapperProfile,
                OrganisationApiMapperProfile,
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
                {
                    provide: OrganisationRepo,
                    useValue: createMock<OrganisationRepo>(),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
                {
                    provide: OrganisationService,
                    useValue: createMock<OrganisationService>(),
                },
                {
                    provide: PersonService,
                    useValue: createMock<PersonService>(),
                },
                {
                    provide: PersonenkontextService,
                    useValue: createMock<PersonenkontextService>(),
                },
                {
                    provide: PersonenkontextAnlage,
                    useValue: createMock<PersonenkontextAnlage>(),
                },
            ],
        }).compile();
        sut = module.get(PersonenkontextUc);
        personServiceMock = module.get(PersonService);
        personenkontextServiceMock = module.get(PersonenkontextService);
        rolleRepoMock = module.get(RolleRepo);
        organisationRepoMock = module.get(OrganisationRepo);
        dbiamPersonenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        organisationServiceMock = module.get(OrganisationService);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('createPersonenkontext', () => {
        describe('when creation of personenkontext is successful', () => {
            it('should return CreatedPersonenkontextDto', async () => {
                const personenkontextDo: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);
                personenkontextServiceMock.createPersonenkontext.mockResolvedValue({
                    ok: true,
                    value: personenkontextDo,
                });

                const result: CreatedPersonenkontextDto | SchulConnexError = await sut.createPersonenkontext(
                    {} as CreatePersonenkontextDto,
                );

                expect(result).toBeInstanceOf(CreatedPersonenkontextDto);
            });
        });

        describe('when creation of personenkontext is not successful', () => {
            it('should return SchulConnexError', async () => {
                const error: EntityCouldNotBeCreated = new EntityCouldNotBeCreated('Personenkontext');
                personenkontextServiceMock.createPersonenkontext.mockResolvedValue({
                    ok: false,
                    error: error,
                });

                const result: CreatedPersonenkontextDto | SchulConnexError = await sut.createPersonenkontext(
                    {} as CreatePersonenkontextDto,
                );

                expect(result).toBeInstanceOf(SchulConnexError);
            });
        });
    });

    describe('findAll', () => {
        describe('When searching for personenkontexte', () => {
            it('should find all persons that match with query param', async () => {
                const findPersonenkontextDto: FindPersonenkontextDto = {
                    personId: faker.string.uuid(),
                    referrer: 'referrer',
                    sichtfreigabe: SichtfreigabeType.NEIN,
                    personenstatus: Personenstatus.AKTIV,
                    rolle: Rolle.LERNENDER,
                };

                const firstPersonenkontext: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);
                const secondPersonenkontext: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);
                const personenkontexte: PersonenkontextDo<true>[] = [firstPersonenkontext, secondPersonenkontext];
                personenkontextServiceMock.findAllPersonenkontexte.mockResolvedValue({
                    items: personenkontexte,
                    total: personenkontexte.length,
                    limit: personenkontexte.length,
                    offset: 0,
                });

                const result: Paged<PersonenkontextDto> = await sut.findAll(findPersonenkontextDto);
                expect(result.items).toHaveLength(2);
            });

            it('should return empty array when no matching persons are found', async () => {
                const findPersonenkontextDto: FindPersonenkontextDto = {
                    personId: faker.string.uuid(),
                    referrer: 'referrer',
                    sichtfreigabe: SichtfreigabeType.NEIN,
                    personenstatus: Personenstatus.AKTIV,
                    rolle: Rolle.LERNENDER,
                };

                const emptyResult: Paged<PersonenkontextDo<true>> = {
                    items: [],
                    total: 0,
                    limit: 0,
                    offset: 0,
                };
                personenkontextServiceMock.findAllPersonenkontexte.mockResolvedValue(emptyResult);

                const result: Paged<PersonenkontextDto> = await sut.findAll(findPersonenkontextDto);

                expect(result.items).toHaveLength(0);
            });
        });
    });

    describe('findPersonenkontextById', () => {
        describe('when finding personenkontext with id', () => {
            it('should return personenkontext', async () => {
                const personDo: PersonDo<true> = DoFactory.createPerson(true);
                const personenkontextDo: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);
                const dto: FindPersonenkontextByIdDto = {
                    personenkontextId: personenkontextDo.id,
                };

                personServiceMock.findPersonById.mockResolvedValue({ ok: true, value: personDo });
                personenkontextServiceMock.findPersonenkontextById.mockResolvedValue({
                    ok: true,
                    value: personenkontextDo,
                });

                await expect(sut.findPersonenkontextById(dto)).resolves.not.toThrow();
            });
        });

        describe('when NOT finding personenkontext with id', () => {
            it('should return SchulConnexError with code 404 for personenkontext not found', async () => {
                const dto: FindPersonenkontextByIdDto = {
                    personenkontextId: faker.string.uuid(),
                };

                personenkontextServiceMock.findPersonenkontextById.mockResolvedValue({
                    ok: false,
                    error: new EntityNotFoundError('Personenkontext'),
                });

                const result: PersonendatensatzDto | SchulConnexError = await sut.findPersonenkontextById(dto);

                if (result instanceof PersonendatensatzDto) {
                    fail('Expected SchulConnexError');
                }
                expect(result.code).toBe(404);
            });

            // AI next 13 lines
            it('should return SchulConnexError with code 404 for person not found', async () => {
                const personenkontextDo: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);
                const dto: FindPersonenkontextByIdDto = {
                    personenkontextId: personenkontextDo.id,
                };

                personenkontextServiceMock.findPersonenkontextById.mockResolvedValue({
                    ok: true,
                    value: personenkontextDo,
                });
                personServiceMock.findPersonById.mockResolvedValue({
                    ok: false,
                    error: new EntityNotFoundError('Person'),
                });

                const result: PersonendatensatzDto | SchulConnexError = await sut.findPersonenkontextById(dto);

                if (result instanceof PersonendatensatzDto) {
                    fail('Expected SchulConnexError');
                }
                expect(result.code).toBe(404);
            });
        });
    });

    describe('hatSystemRecht', () => {
        describe('when personenkontext is referencing rolle with a systemrecht in systemrechte array', () => {
            it('should return an array with the matching organisation as SSK, parent and children', async () => {
                const personenkontexte: Personenkontext<true>[] = createPersonenkontext();
                const rolle: RolleAggregate<true> = createRolle();
                rolle.systemrechte = [RollenSystemRecht.ROLLEN_VERWALTEN];
                const organisation: OrganisationDo<true> = DoFactory.createOrganisation(true);
                rolleRepoMock.findById.mockResolvedValue(rolle);
                organisationRepoMock.findById.mockResolvedValue(organisation);

                const children: OrganisationDo<true>[] = [
                    DoFactory.createOrganisation(true),
                    DoFactory.createOrganisation(true),
                    DoFactory.createOrganisation(true),
                ];

                const findAllAdministriertVon: Paged<OrganisationDo<true>> = {
                    items: children,
                    offset: 0,
                    limit: children.length,
                    total: children.length,
                };
                organisationServiceMock.findAllAdministriertVon.mockResolvedValue(findAllAdministriertVon);
                personenkontextServiceMock.findPersonenkontexteByPersonId.mockResolvedValue(personenkontexte);
                const result: SystemrechtResponse = await sut.hatSystemRecht('1', RollenSystemRecht.ROLLEN_VERWALTEN);
                expect(result.ROLLEN_VERWALTEN).toBeTruthy();
                expect(result.ROLLEN_VERWALTEN).toHaveLength(4);
            });
        });

        describe('when no rollen with a non-empty systemrechte-array exist', () => {
            it('should return an empty array', async () => {
                const personenkontexte: Personenkontext<true>[] = createPersonenkontext();
                const rolle: RolleAggregate<true> = createRolle();
                const organisation: OrganisationDo<true> = DoFactory.createOrganisation(true);
                rolleRepoMock.findById.mockResolvedValue(rolle);
                organisationRepoMock.findById.mockResolvedValue(organisation);
                personenkontextServiceMock.findPersonenkontexteByPersonId.mockResolvedValue(personenkontexte);
                const result: SystemrechtResponse = await sut.hatSystemRecht('1', RollenSystemRecht.ROLLEN_VERWALTEN);
                expect(result.ROLLEN_VERWALTEN).toBeTruthy();
                expect(result.ROLLEN_VERWALTEN).toHaveLength(0);
            });
        });

        describe('when no organisations are found via organisationId of personenkontext', () => {
            it('should return an empty array', async () => {
                const personenkontexte: Personenkontext<true>[] = createPersonenkontext();
                const rolle: RolleAggregate<true> = createRolle();
                rolleRepoMock.findById.mockResolvedValue(rolle);
                organisationRepoMock.findById.mockResolvedValue(undefined);
                personenkontextServiceMock.findPersonenkontexteByPersonId.mockResolvedValue(personenkontexte);
                const result: SystemrechtResponse = await sut.hatSystemRecht('1', RollenSystemRecht.ROLLEN_VERWALTEN);
                expect(result.ROLLEN_VERWALTEN).toBeTruthy();
                expect(result.ROLLEN_VERWALTEN).toHaveLength(0);
            });
        });

        describe('when no rollen are found via rolleId of personenkontext', () => {
            it('should return an empty array', async () => {
                const personenkontexte: Personenkontext<true>[] = createPersonenkontext();
                rolleRepoMock.findById.mockResolvedValue(undefined);
                personenkontextServiceMock.findPersonenkontexteByPersonId.mockResolvedValue(personenkontexte);
                const result: SystemrechtResponse = await sut.hatSystemRecht('1', RollenSystemRecht.ROLLEN_VERWALTEN);
                expect(result.ROLLEN_VERWALTEN).toBeTruthy();
                expect(result.ROLLEN_VERWALTEN).toHaveLength(0);
            });
        });
    });

    describe('updatePersonenkontext', () => {
        // AI next 34 lines
        describe('when updating personenkontext is successful', () => {
            it('should return a PersonendatensatzDto', async () => {
                const personDo: PersonDo<true> = DoFactory.createPerson(true);
                const personenkontextDo: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);

                personServiceMock.findPersonById.mockResolvedValue({ ok: true, value: personDo });
                personenkontextServiceMock.updatePersonenkontext.mockResolvedValue({
                    ok: true,
                    value: personenkontextDo,
                });

                const updatePersonPromise: Promise<PersonendatensatzDto | SchulConnexError> = sut.updatePersonenkontext(
                    {} as PersonenkontextDto,
                );

                await expect(updatePersonPromise).resolves.toBeInstanceOf(PersonendatensatzDto);
            });
        });

        describe('when updating personenkontext is not successful', () => {
            it('should return SchulConnexError', async () => {
                const error: EntityCouldNotBeCreated = new EntityCouldNotBeCreated('Personenkontext');
                personenkontextServiceMock.updatePersonenkontext.mockResolvedValue({
                    ok: false,
                    error: error,
                });

                const updatePersonPromise: Promise<PersonendatensatzDto | SchulConnexError> = sut.updatePersonenkontext(
                    {} as PersonenkontextDto,
                );

                await expect(updatePersonPromise).resolves.toBeInstanceOf(SchulConnexError);
            });
        });

        describe('when person for personenkontext could not be found', () => {
            it('should return SchulConnexError', async () => {
                // AI next 13 lines
                const personenkontextDo: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);
                const error: EntityNotFoundError = new EntityNotFoundError('Person');

                personenkontextServiceMock.updatePersonenkontext.mockResolvedValue({
                    ok: true,
                    value: personenkontextDo,
                });
                personServiceMock.findPersonById.mockResolvedValue({ ok: false, error: error });

                const updatePersonPromise: Promise<PersonendatensatzDto | SchulConnexError> = sut.updatePersonenkontext(
                    {} as PersonenkontextDto,
                );

                await expect(updatePersonPromise).resolves.toBeInstanceOf(SchulConnexError);
            });
        });
    });

    describe('findRollen', () => {
        describe('when rollen can be found', () => {
            it('should return a response with items', async () => {
                const params: FindPersonenkontextRollenBodyParams = {
                    rolleName: faker.string.alpha(),
                    limit: 1,
                };
                const rollen: RolleAggregate<true>[] = [DoFactory.createRolle(true)];
                rolleRepoMock.findByName.mockResolvedValue(rollen); //called via PersonenkontextAnlage aggregate
                const result: FindRollenResponse = await sut.findRollen(params);
                expect(result).toBeTruthy();
                expect(result.moeglicheRollen).toHaveLength(1);
                expect(rolleRepoMock.findByName).toHaveBeenCalledTimes(1);
            });
        });

        describe('when rollen cannot be found', () => {
            it('should return a response with an empty list', async () => {
                const params: FindPersonenkontextRollenBodyParams = {
                    rolleName: faker.string.alpha(),
                    limit: 1,
                };
                rolleRepoMock.findByName.mockResolvedValue([]); //called via PersonenkontextAnlage aggregate
                const result: FindRollenResponse = await sut.findRollen(params);
                expect(result).toBeTruthy();
                expect(result.moeglicheRollen).toHaveLength(0);
                expect(rolleRepoMock.findByName).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('findSchulstrukturknoten', () => {
        describe('when ssks can be found', () => {
            it('should return a response with items', async () => {
                const rolleId: string = faker.string.uuid();
                const organisationName: string = faker.string.alpha();
                const organisation: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    name: organisationName,
                });
                const params: FindPersonenkontextSchulstrukturknotenBodyParams = {
                    rolleId: rolleId,
                    sskName: organisationName,
                    limit: 1,
                };
                const ssks: Option<OrganisationDo<true>[]> = [organisation];

                const personenkontexte: Personenkontext<true>[] = [
                    {
                        rolleId: rolleId,
                        organisationId: organisation.id,
                        personId: faker.string.uuid(),
                        createdAt: faker.date.past(),
                        updatedAt: faker.date.recent(),
                        id: '1',
                    },
                ];
                organisationRepoMock.findByNameOrKennung.mockResolvedValue(ssks);
                dbiamPersonenkontextRepoMock.findByRolle.mockResolvedValue(personenkontexte);
                const result: FindSchulstrukturknotenResponse = await sut.findSchulstrukturknoten(params);
                expect(result).toBeTruthy();
                expect(result.moeglicheSkks).toHaveLength(1);
                expect(organisationRepoMock.findByNameOrKennung).toHaveBeenCalledTimes(1);
                expect(dbiamPersonenkontextRepoMock.findByRolle).toHaveBeenCalledTimes(1);
            });
        });

        describe('when ssks cannot be found', () => {
            it('should return a response with an empty list', async () => {
                const rolleId: string = faker.string.uuid();
                const organisationName: string = faker.string.alpha();
                const organisation: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    name: organisationName,
                });
                const params: FindPersonenkontextSchulstrukturknotenBodyParams = {
                    rolleId: rolleId,
                    sskName: organisationName,
                    limit: 1,
                };
                const personenkontexte: Personenkontext<true>[] = [
                    {
                        rolleId: rolleId,
                        organisationId: organisation.id,
                        personId: faker.string.uuid(),
                        createdAt: faker.date.past(),
                        updatedAt: faker.date.recent(),
                        id: '1',
                    },
                ];
                organisationRepoMock.findByNameOrKennung.mockResolvedValue([]);
                dbiamPersonenkontextRepoMock.findByRolle.mockResolvedValue(personenkontexte);
                const result: FindSchulstrukturknotenResponse = await sut.findSchulstrukturknoten(params);
                expect(result).toBeTruthy();
                expect(result.moeglicheSkks).toHaveLength(0);
                expect(organisationRepoMock.findByNameOrKennung).toHaveBeenCalledTimes(1);
                expect(dbiamPersonenkontextRepoMock.findByRolle).toHaveBeenCalledTimes(0);
            });
        });
    });

    describe('deletePersonenkontextById', () => {
        const deletePersonenkontextDto: DeletePersonenkontextDto = {
            id: faker.string.uuid(),
            revision: '1',
        };

        describe('when deleting personenkontext is successful', () => {
            it('should return nothing', async () => {
                personenkontextServiceMock.deletePersonenkontextById.mockResolvedValue({
                    ok: true,
                    value: undefined,
                });

                const result: void | SchulConnexError = await sut.deletePersonenkontextById(deletePersonenkontextDto);

                expect(result).toBeUndefined();
            });
        });

        describe('when personenkontext that should be deleted was not found', () => {
            it('should return SchulConnexError', async () => {
                personenkontextServiceMock.deletePersonenkontextById.mockResolvedValue({
                    ok: false,
                    error: new EntityNotFoundError('Personenkontext'),
                });

                const result: void | SchulConnexError = await sut.deletePersonenkontextById(deletePersonenkontextDto);

                expect(result).toBeInstanceOf(SchulConnexError);
                expect(result?.code).toBe(404);
            });
        });
    });
});
