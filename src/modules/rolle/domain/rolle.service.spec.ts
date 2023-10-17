import {Test, TestingModule} from "@nestjs/testing";
import {createMock, DeepMocked} from "@golevelup/ts-jest";
import {Dictionary, Mapper} from "@automapper/core";
import {getMapperToken} from "@automapper/nestjs";
import {DoFactory} from "../../../../test/utils";
import {RolleService} from "./rolle.service";
import {PersonRollenZuweisungRepo} from "../repo/person-rollen-zuweisung.repo";
import {RollenBerechtigungsZuweisungRepo} from "../repo/rollen-berechtigungs-zuweisung.repo";
import {RolleRechtRepo} from "../repo/rolle-recht.repo";
import {ServiceProviderRepo} from "../repo/service-provider.repo";
import {PersonRollenZuweisungDo} from "./person-rollen-zuweisung.do";
import {RolleDo} from "./rolle.do";

describe('RolleService', () => {
    let module: TestingModule;
    let rolleService: RolleService;
    let personRollenZuweisungRepo: DeepMocked<PersonRollenZuweisungRepo>;
  /*  let rolleBerechtigungsZuweisungRepo: DeepMocked<RollenBerechtigungsZuweisungRepo>;
    let rolleRechtRepo: DeepMocked<RolleRechtRepo>;
    let serviceProviderRepo: DeepMocked<ServiceProviderRepo>;*/
    let mapperMock: DeepMocked<Mapper>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                RolleService,
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
        personRollenZuweisungRepo = module.get(PersonRollenZuweisungRepo);
      /*  rolleBerechtigungsZuweisungRepo = module.get(RollenBerechtigungsZuweisungRepo);
        rolleRechtRepo = module.get(RolleRechtRepo);
        serviceProviderRepo = module.get(ServiceProviderRepo);*/
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

    describe('getPersonRollenZuweisung', () => {
        describe('when PersonRollenZuweisung exists', () => {
            it('should get a PersonRollenZuweisung ', async () => {
                const rolle: RolleDo<true> = DoFactory.createRolle(true);
                const personRollenZuweisung: PersonRollenZuweisungDo<true> = DoFactory.createPersonRollenZuweisung('1', rolle, true);
                const array: PersonRollenZuweisungDo<true>[] = [];
                array.push(personRollenZuweisung);
                personRollenZuweisungRepo.findAllByPersonId.mockResolvedValue(array);
                mapperMock.map.mockReturnValue(personRollenZuweisung as unknown as Dictionary<unknown>);
                const result: PersonRollenZuweisungDo<true>[] = await rolleService.getPersonRollenZuweisung('1');
                expect(result).not.toBeNull();
            });
        });
        describe('when PersonRollenZuweisung does not exist', () => {
            it('should get an empty array ', async () => {
                const rolle: RolleDo<true> = DoFactory.createRolle(true);
                const personRollenZuweisung: PersonRollenZuweisungDo<true> = DoFactory.createPersonRollenZuweisung('1', rolle, true);
                personRollenZuweisungRepo.findAllByPersonId.mockResolvedValue([]);
                mapperMock.map.mockReturnValue(personRollenZuweisung as unknown as Dictionary<unknown>);
                const result: PersonRollenZuweisungDo<true>[] = await rolleService.getPersonRollenZuweisung('1');
                expect(result).toHaveLength(0);
            });
        });

    });

});
