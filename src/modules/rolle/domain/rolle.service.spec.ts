import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Dictionary, Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { DoFactory } from '../../../../test/utils/index.js';
import { KeyCloakUser, RolleService } from './rolle.service.js';
import { PersonRollenZuweisungRepo } from '../repo/person-rollen-zuweisung.repo.js';
import { RollenBerechtigungsZuweisungRepo } from '../repo/rollen-berechtigungs-zuweisung.repo.js';
import { RolleRechtRepo } from '../repo/rolle-recht.repo.js';
import { ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { PersonRollenZuweisungDo } from './person-rollen-zuweisung.do.js';
import { Rolle } from './rolle.js';
import { RolleBerechtigungsZuweisungDo } from './rolle-berechtigungs-zuweisung.do.js';
import { ServiceProviderZugriffDo } from './service-provider-zugriff.do.js';
import { ServiceProviderDo } from './service-provider.do.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';
import { faker } from '@faker-js/faker';
import { PersonDo } from '../../person/domain/person.do.js';
import { GetServiceProviderInfoDo } from './get-service-provider-info.do.js';

describe('RolleService', () => {
    let module: TestingModule;
    let rolleService: RolleService;
    let personRepo: DeepMocked<PersonRepo>;
    let personRollenZuweisungRepo: DeepMocked<PersonRollenZuweisungRepo>;
    let rolleBerechtigungsZuweisungRepo: DeepMocked<RollenBerechtigungsZuweisungRepo>;
    let rolleRechtRepo: DeepMocked<RolleRechtRepo>;
    let serviceProviderRepo: DeepMocked<ServiceProviderRepo>;
    let mapperMock: DeepMocked<Mapper>;
    const PERSON_ID: string = '1';

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                RolleService,
                {
                    provide: PersonRepo,
                    useValue: createMock<PersonRepo>(),
                },
                {
                    provide: PersonRollenZuweisungRepo,
                    useValue: createMock<PersonRollenZuweisungRepo>(),
                },
                {
                    provide: RollenBerechtigungsZuweisungRepo,
                    useValue: createMock<RollenBerechtigungsZuweisungRepo>(),
                },
                {
                    provide: RolleRechtRepo,
                    useValue: createMock<RolleRechtRepo>(),
                },
                {
                    provide: ServiceProviderRepo,
                    useValue: createMock<ServiceProviderRepo>(),
                },
                {
                    provide: getMapperToken(),
                    useValue: createMock<Mapper>(),
                },
            ],
        }).compile();
        rolleService = module.get(RolleService);
        personRepo = module.get(PersonRepo);
        personRollenZuweisungRepo = module.get(PersonRollenZuweisungRepo);
        rolleBerechtigungsZuweisungRepo = module.get(RollenBerechtigungsZuweisungRepo);
        rolleRechtRepo = module.get(RolleRechtRepo);
        serviceProviderRepo = module.get(ServiceProviderRepo);
        mapperMock = module.get(getMapperToken());
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(rolleService).toBeDefined();
    });

    describe('hasKeycloakUserSub', () => {
        describe('when user has property sub', () => {
            it('should be truthy', () => {
                const user: KeyCloakUser = {
                    sub: faker.string.uuid(),
                };
                expect(rolleService.hasKeycloakUserSub(user)).toBeTruthy();
            });
            describe('when obj has no property sub', () => {
                it('should be falsy', () => {
                    const user: unknown = {};
                    expect(rolleService.hasKeycloakUserSub(user)).toBeFalsy();
                });
            });
        });
    });

    describe('getPersonRollenZuweisung', () => {
        describe('when PersonRollenZuweisung exists', () => {
            it('should get a PersonRollenZuweisung ', async () => {
                const rolle: Rolle<true> = DoFactory.createRolle(true);
                const personRollenZuweisung: PersonRollenZuweisungDo<true> = DoFactory.createPersonRollenZuweisung(
                    PERSON_ID,
                    rolle.id,
                    true,
                );
                const array: PersonRollenZuweisungDo<true>[] = [];
                array.push(personRollenZuweisung);
                personRollenZuweisungRepo.findAllByPersonId.mockResolvedValue(array);
                mapperMock.map.mockReturnValue(personRollenZuweisung as unknown as Dictionary<unknown>);
                const result: PersonRollenZuweisungDo<true>[] = await rolleService.getPersonRollenZuweisung(PERSON_ID);
                expect(result).not.toBeNull();
            });
        });
        describe('when PersonRollenZuweisung does not exist', () => {
            it('should get an empty array ', async () => {
                const rolle: Rolle<true> = DoFactory.createRolle(true);
                const personRollenZuweisung: PersonRollenZuweisungDo<true> = DoFactory.createPersonRollenZuweisung(
                    PERSON_ID,
                    rolle.id,
                    true,
                );
                personRollenZuweisungRepo.findAllByPersonId.mockResolvedValue([]);
                mapperMock.map.mockReturnValue(personRollenZuweisung as unknown as Dictionary<unknown>);
                const result: PersonRollenZuweisungDo<true>[] = await rolleService.getPersonRollenZuweisung(PERSON_ID);
                expect(result).toHaveLength(0);
            });
        });
    });

    describe('getRolleBerechtigungsZuweisung', () => {
        describe('when RolleBerechtigungsZuweisung exists', () => {
            it('should get a RolleBerechtigungsZuweisung ', async () => {
                const rolle: Rolle<true> = DoFactory.createRolle(true);
                const serviceProviderZugriffDo: ServiceProviderZugriffDo<true> =
                    DoFactory.createServiceProviderZugriff(true);
                const rolleBerechtigungsZuweisung: RolleBerechtigungsZuweisungDo<true> =
                    DoFactory.createRolleBerechtigungsZuweisung(rolle.id, serviceProviderZugriffDo, true);
                const array: RolleBerechtigungsZuweisungDo<true>[] = [];
                array.push(rolleBerechtigungsZuweisung);
                rolleBerechtigungsZuweisungRepo.findAllRolleBerechtigungsZuweisungByRolle.mockResolvedValue(array);
                mapperMock.map.mockReturnValue(rolleBerechtigungsZuweisung as unknown as Dictionary<unknown>);
                const result: RolleBerechtigungsZuweisungDo<true>[] = await rolleService.getRolleBerechtigungsZuweisung(
                    rolle.id,
                );
                expect(result).not.toBeNull();
            });
        });
        describe('when RolleBerechtigungsZuweisung does not exist', () => {
            it('should get an empty array ', async () => {
                const rolle: Rolle<true> = DoFactory.createRolle(true);
                const serviceProviderZugriffDo: ServiceProviderZugriffDo<true> =
                    DoFactory.createServiceProviderZugriff(true);
                const rolleBerechtigungsZuweisung: RolleBerechtigungsZuweisungDo<true> =
                    DoFactory.createRolleBerechtigungsZuweisung(rolle.id, serviceProviderZugriffDo, true);
                rolleBerechtigungsZuweisungRepo.findAllRolleBerechtigungsZuweisungByRolle.mockResolvedValue([]);
                mapperMock.map.mockReturnValue(rolleBerechtigungsZuweisung as unknown as Dictionary<unknown>);
                const result: RolleBerechtigungsZuweisungDo<true>[] = await rolleService.getRolleBerechtigungsZuweisung(
                    rolle.id,
                );
                expect(result).toHaveLength(0);
            });
        });
    });

    describe('getRolleBerechtigungsZuweisungByPersonId', () => {
        describe('when RolleBerechtigungsZuweisung exists', () => {
            it('should get a RolleBerechtigungsZuweisung ', async () => {
                const rolle: Rolle<true> = DoFactory.createRolle(true);
                const serviceProviderZugriffDo: ServiceProviderZugriffDo<true> =
                    DoFactory.createServiceProviderZugriff(true);
                const personRollenZuweisung: PersonRollenZuweisungDo<true> = DoFactory.createPersonRollenZuweisung(
                    PERSON_ID,
                    rolle.id,
                    true,
                );
                const rolleBerechtigungsZuweisung: RolleBerechtigungsZuweisungDo<true> =
                    DoFactory.createRolleBerechtigungsZuweisung(rolle.id, serviceProviderZugriffDo, true);
                const rolleBerechtigungZuweisungList: RolleBerechtigungsZuweisungDo<true>[] = [];
                const personRollenZuweisungList: PersonRollenZuweisungDo<true>[] = [];
                personRollenZuweisungList.push(personRollenZuweisung);
                rolleBerechtigungZuweisungList.push(rolleBerechtigungsZuweisung);
                personRollenZuweisungRepo.findAllByPersonId.mockResolvedValue(personRollenZuweisungList);
                rolleBerechtigungsZuweisungRepo.findAllRolleBerechtigungsZuweisungByRolle.mockResolvedValue(
                    rolleBerechtigungZuweisungList,
                );
                mapperMock.map.mockReturnValue(rolleBerechtigungsZuweisung as unknown as Dictionary<unknown>);
                const result: RolleBerechtigungsZuweisungDo<true>[] =
                    await rolleService.getRolleBerechtigungsZuweisungByPersonId(PERSON_ID);
                expect(result).not.toBeNull();
            });
        });
        describe('when RolleBerechtigungsZuweisung does not exist', () => {
            it('should get an empty array ', async () => {
                const rolle: Rolle<true> = DoFactory.createRolle(true);
                const serviceProviderZugriffDo: ServiceProviderZugriffDo<true> =
                    DoFactory.createServiceProviderZugriff(true);
                const rolleBerechtigungsZuweisung: RolleBerechtigungsZuweisungDo<true> =
                    DoFactory.createRolleBerechtigungsZuweisung(rolle.id, serviceProviderZugriffDo, true);
                personRollenZuweisungRepo.findAllByPersonId.mockResolvedValue([]);
                rolleBerechtigungsZuweisungRepo.findAllRolleBerechtigungsZuweisungByRolle.mockResolvedValue([]);
                mapperMock.map.mockReturnValue(rolleBerechtigungsZuweisung as unknown as Dictionary<unknown>);
                const result: RolleBerechtigungsZuweisungDo<true>[] =
                    await rolleService.getRolleBerechtigungsZuweisungByPersonId(PERSON_ID);
                expect(result).toHaveLength(0);
            });
        });
    });

    describe('getServiceProvider by ServiceProviderZugriff', () => {
        describe('when ServiceProvider exists', () => {
            it('should get a ServiceProvider ', async () => {
                const serviceProvider: ServiceProviderDo<true> = DoFactory.createServiceProvider(true);
                const serviceProviderZugriff: ServiceProviderZugriffDo<true> =
                    DoFactory.createServiceProviderZugriff(true);
                const serviceProviderList: ServiceProviderDo<true>[] = [];
                serviceProviderList.push(serviceProvider);
                serviceProviderRepo.findAll.mockResolvedValue(serviceProviderList);
                mapperMock.map.mockReturnValue(serviceProvider as unknown as Dictionary<unknown>);
                const result: ServiceProviderDo<true>[] = await rolleService.getServiceProvider(serviceProviderZugriff);
                expect(result).not.toBeNull();
            });
        });
        describe('when ServiceProvider does not exist', () => {
            it('should get an empty array ', async () => {
                const serviceProviderZugriff: ServiceProviderZugriffDo<true> =
                    DoFactory.createServiceProviderZugriff(true);
                const serviceProvider: ServiceProviderDo<true> = DoFactory.createServiceProvider(true);
                serviceProviderRepo.findAll.mockResolvedValue([]);
                mapperMock.map.mockReturnValue(serviceProvider as unknown as Dictionary<unknown>);
                const result: ServiceProviderDo<true>[] = await rolleService.getServiceProvider(serviceProviderZugriff);
                expect(result).toHaveLength(0);
            });
        });
    });

    function initServiceProviderTestSuccessEssentials(): void {
        const rolle: Rolle<true> = DoFactory.createRolle(true);
        const serviceProvider: ServiceProviderDo<true> = DoFactory.createServiceProvider(true);
        const serviceProviderZugriff: ServiceProviderZugriffDo<true> = DoFactory.createServiceProviderZugriff(true);
        const personRollenZuweisung: PersonRollenZuweisungDo<true> = DoFactory.createPersonRollenZuweisung(
            PERSON_ID,
            rolle.id,
            true,
        );
        const rolleBerechtigungsZuweisung: RolleBerechtigungsZuweisungDo<true> =
            DoFactory.createRolleBerechtigungsZuweisung(rolle.id, serviceProviderZugriff, true);
        const serviceProviderList: ServiceProviderDo<true>[] = [];
        const serviceProviderZugriffList: ServiceProviderZugriffDo<true>[] = [];
        const rolleBerechtigungZuweisungList: RolleBerechtigungsZuweisungDo<true>[] = [];
        const personRollenZuweisungList: PersonRollenZuweisungDo<true>[] = [];
        serviceProviderList.push(serviceProvider);
        serviceProviderZugriffList.push(serviceProviderZugriff);
        personRollenZuweisungList.push(personRollenZuweisung);
        rolleBerechtigungZuweisungList.push(rolleBerechtigungsZuweisung);
        personRollenZuweisungRepo.findAllByPersonId.mockResolvedValue(personRollenZuweisungList);
        rolleBerechtigungsZuweisungRepo.findAllRolleBerechtigungsZuweisungByRolle.mockResolvedValue(
            rolleBerechtigungZuweisungList,
        );
        serviceProviderRepo.findAll.mockResolvedValue(serviceProviderList);
        rolleRechtRepo.findAllServiceProviderZugriff.mockResolvedValue(serviceProviderZugriffList);
        mapperMock.map.mockReturnValue(serviceProviderZugriff as unknown as Dictionary<unknown>);
    }

    function initServiceProviderTestFailEssentials(): void {
        const serviceProviderZugriff: ServiceProviderZugriffDo<true> = DoFactory.createServiceProviderZugriff(true);
        personRollenZuweisungRepo.findAllByPersonId.mockResolvedValue([]);
        rolleBerechtigungsZuweisungRepo.findAllRolleBerechtigungsZuweisungByRolle.mockResolvedValue([]);
        serviceProviderRepo.findAll.mockResolvedValue([]);
        rolleRechtRepo.findAllServiceProviderZugriff.mockResolvedValue([]);
        mapperMock.map.mockReturnValue(serviceProviderZugriff as unknown as Dictionary<unknown>);
    }

    describe('getServiceProviderZugriffList by personId', () => {
        describe('when ServiceProviderZugriff exists', () => {
            it('should get a ServiceProviderZugriff ', async () => {
                initServiceProviderTestSuccessEssentials();
                const result: ServiceProviderZugriffDo<true>[] =
                    await rolleService.getServiceProviderZugriffList(PERSON_ID);
                expect(result).not.toBeNull();
            });
        });
        describe('when ServiceProviderZugriff does not exist', () => {
            it('should get an empty array ', async () => {
                initServiceProviderTestFailEssentials();
                const result: ServiceProviderZugriffDo<true>[] =
                    await rolleService.getServiceProviderZugriffList(PERSON_ID);
                expect(result).toHaveLength(0);
            });
        });
    });

    describe('getAvailableServiceProviders by personId', () => {
        describe('when ServiceProvider exists', () => {
            it('should get a ServiceProvider ', async () => {
                initServiceProviderTestSuccessEssentials();
                const result: ServiceProviderDo<true>[] = await rolleService.getAvailableServiceProviders(PERSON_ID);
                expect(result).not.toBeNull();
            });
        });
        describe('when ServiceProvider does not exist', () => {
            it('should get an empty array ', async () => {
                initServiceProviderTestFailEssentials();
                const result: ServiceProviderDo<true>[] = await rolleService.getAvailableServiceProviders(PERSON_ID);
                expect(result).toHaveLength(0);
            });
        });
    });

    describe('getAvailableServiceProvidersByUserSub', () => {
        describe('when person with keycloakUserId exists', () => {
            it('should get a ServiceProvider ', async () => {
                initServiceProviderTestSuccessEssentials();
                const person: PersonDo<true> = DoFactory.createPerson(true);
                personRepo.findByKeycloakUserId.mockResolvedValue(person);
                const result: ServiceProviderDo<true>[] =
                    await rolleService.getAvailableServiceProvidersByUserSub(PERSON_ID);
                expect(result).not.toBeNull();
            });
        });
        describe('when person with keycloakUserId does not exist', () => {
            it('should get an empty array ', async () => {
                initServiceProviderTestFailEssentials();
                personRepo.findByKeycloakUserId.mockResolvedValue(null);
                const result: ServiceProviderDo<true>[] =
                    await rolleService.getAvailableServiceProvidersByUserSub(PERSON_ID);
                expect(result).toHaveLength(0);
            });
        });
    });

    describe('getServiceProviderInfoListByUserSub', () => {
        describe('when person with keycloakUserId exists', () => {
            it('should get a ServiceProvider ', async () => {
                initServiceProviderTestSuccessEssentials();
                const person: PersonDo<true> = DoFactory.createPerson(true);
                personRepo.findByKeycloakUserId.mockResolvedValue(person);
                const result: GetServiceProviderInfoDo[] =
                    await rolleService.getServiceProviderInfoListByUserSub(PERSON_ID);
                expect(result).not.toBeNull();
                expect(result).not.toHaveLength(0);
            });
        });
        describe('when person with keycloakUserId does not exist', () => {
            it('should get an empty array ', async () => {
                initServiceProviderTestFailEssentials();
                personRepo.findByKeycloakUserId.mockResolvedValue(null);
                const result: GetServiceProviderInfoDo[] =
                    await rolleService.getServiceProviderInfoListByUserSub(PERSON_ID);
                expect(result).toHaveLength(0);
            });
        });
    });
});
