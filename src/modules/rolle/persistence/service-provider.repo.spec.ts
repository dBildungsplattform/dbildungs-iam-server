import {Test, TestingModule} from "@nestjs/testing";
import {EntityManager, MikroORM} from "@mikro-orm/core";
import {Mapper} from "@automapper/core";
import {ConfigTestModule, DatabaseTestModule, DoFactory, MapperTestModule} from "../../../../test/utils";
import {getMapperToken} from "@automapper/nestjs";
import {ServiceProviderRepo} from "./service-provider.repo";
import {ServiceProviderMapperProfile} from "./service-provider.mapper.profile";
import {ServiceProviderZugriffDo} from "../domain/service-provider-zugriff.do";
import {ServiceProviderDo} from "../domain/service-provider.do";
import {ServiceProviderEntity} from "./service-provider.entity";
import {ServiceProviderZugriffEntity} from "./service-provider-zugriff.entity";
import {ServiceProviderZugriffMapperProfile} from "./service-provider-zugriff.mapper.profile";

describe('ServiceProviderRepo', () => {
    let module: TestingModule;
    let sut: ServiceProviderRepo;
    let orm: MikroORM;
    let em: EntityManager;
    let mapper: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({isDatabaseRequired: true}), MapperTestModule],
            providers: [ServiceProviderMapperProfile, ServiceProviderZugriffMapperProfile, ServiceProviderRepo],
        }).compile();
        sut = module.get(ServiceProviderRepo);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        mapper = module.get(getMapperToken());
        await DatabaseTestModule.setupDatabase(orm);
    }, 30 * 1_000);

    afterAll(async () => {
        await module.close();
    }, 30 * 1_000);

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('findById provided by ServiceProviderZugriffDo', () => {
        describe('when found by id', () => {
            it('should return found serviceProvider', async () => {
                const props: Partial<ServiceProviderDo<false>> = {
                    id: '1'
                };
                const serviceProviderDo: ServiceProviderDo<false> = DoFactory.createServiceProvider(false, props);
                const serviceProviderZugriffDo: ServiceProviderZugriffDo<false> = DoFactory.createServiceProviderZugriff(false, {serviceProvider: '123'});
                await em.persistAndFlush(mapper.map(serviceProviderDo, ServiceProviderDo, ServiceProviderEntity));
                await em.persistAndFlush(mapper.map(serviceProviderZugriffDo, ServiceProviderZugriffDo, ServiceProviderZugriffEntity));

                const serviceProvider: ServiceProviderEntity[] = await em.find(ServiceProviderEntity, {});
                expect(serviceProvider).not.toBeNull();
                expect(serviceProvider).toHaveLength(1);
                console.log(serviceProvider[0]);

                const serviceProviderZugriff: ServiceProviderZugriffEntity[] = await em.find(ServiceProviderZugriffEntity, {});
                expect(serviceProviderZugriff).not.toBeNull();
                expect(serviceProviderZugriff).toHaveLength(1);
                console.log(serviceProviderZugriff[0]);

                const foundServiceProvider: ServiceProviderDo<true>[] = await sut.findAll(serviceProviderZugriffDo);
                expect(foundServiceProvider).not.toBeNull();
                expect(foundServiceProvider).toHaveLength(1);

             /*   const personDo: PersonDo<false> = DoFactory.createPerson(false, {referrer: faker.string.uuid()});
                await em.persistAndFlush(mapper.map(personDo, PersonDo, PersonEntity));
                const [person]: PersonEntity[] = await em.find(PersonEntity, {});
                expect(person).toBeInstanceOf(PersonEntity);
                const foundPerson: Option<PersonDo<true>> = await sut.findAll((person as PersonEntity).id);
                expect(foundPerson).toBeInstanceOf(PersonDo);*/
            });
        });

        describe('when not found by id provided by ServiceProviderZugriffDo', () => {
            it('should return null', async () => {
                const serviceProviderZugriffDo: ServiceProviderZugriffDo<true> = DoFactory.createServiceProviderZugriff(true);
                const foundServiceProvider: Option<ServiceProviderDo<true>[]> = await sut.findAll(serviceProviderZugriffDo);
                expect(foundServiceProvider).toHaveLength(0);
            });
        });
    });
});
