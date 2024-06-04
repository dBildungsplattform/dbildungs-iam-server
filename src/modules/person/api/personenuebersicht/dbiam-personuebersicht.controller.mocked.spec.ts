import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DoFactory,
    MapperTestModule,
} from '../../../../../test/utils/index.js';
import { ServiceProviderRepo } from '../../../service-provider/repo/service-provider.repo.js';
import { PersonApiModule } from '../../person-api.module.js';
import { PersonRepository } from '../../persistence/person.repository.js';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { faker } from '@faker-js/faker';
import { RolleFactory } from '../../../rolle/domain/rolle.factory.js';
import { RolleRepo } from '../../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../../rolle/domain/rolle.js';
import { OrganisationRepo } from '../../../organisation/persistence/organisation.repo.js';
import { OrganisationDo } from '../../../organisation/domain/organisation.do.js';
import { Personenkontext } from '../../../personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextRepo } from '../../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { DBiamPersonenuebersichtController } from './dbiam-personenuebersicht.controller.js';
import { DBiamFindPersonenuebersichtByPersonIdParams } from './dbiam-find-personenuebersicht-by-personid.params.js';
import { Person } from '../../domain/person.js';

function createPersonenkontext<WasPersisted extends boolean>(
    this: void,
    withId: WasPersisted,
    params: Partial<Personenkontext<boolean>> = {},
): Personenkontext<WasPersisted> {
    const personenkontext: Personenkontext<WasPersisted> = Personenkontext.construct<boolean>(
        withId ? faker.string.uuid() : undefined,
        withId ? faker.date.past() : undefined,
        withId ? faker.date.recent() : undefined,
        faker.string.uuid(),
        faker.string.uuid(),
        faker.string.uuid(),
    );

    Object.assign(personenkontext, params);

    return personenkontext;
}

function createPerson(): Person<true> {
    return Person.construct(
        faker.string.uuid(),
        faker.date.past(),
        faker.date.recent(),
        faker.person.lastName(),
        faker.person.firstName(),
        '1',
        faker.lorem.word(),
        undefined,
        faker.string.uuid(),
    );
}

describe('Personenuebersicht API Mocked', () => {
    let sut: DBiamPersonenuebersichtController;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let organisationRepositoryMock: DeepMocked<OrganisationRepo>;
    let dBiamPersonenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let personRepositoryMock: DeepMocked<PersonRepository>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                PersonApiModule,
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: false }),
                MapperTestModule,
            ],
            providers: [ServiceProviderRepo, RolleFactory],
        })
            .overrideProvider(DBiamPersonenkontextRepo)
            .useValue(createMock<DBiamPersonenkontextRepo>())
            .overrideProvider(RolleRepo)
            .useValue(createMock<RolleRepo>())
            .overrideProvider(OrganisationRepo)
            .useValue(createMock<OrganisationRepo>())
            .overrideProvider(PersonRepository)
            .useValue(createMock<PersonRepository>())

            .compile();

        sut = module.get(DBiamPersonenuebersichtController);
        rolleRepoMock = module.get(RolleRepo);
        organisationRepositoryMock = module.get(OrganisationRepo);
        dBiamPersonenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        personRepositoryMock = module.get(PersonRepository);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    describe('/GET personenuebersicht', () => {
        describe('when not successfull', () => {
            describe('when one or more rollen does not exist', () => {
                it('should return Error', async () => {
                    const params: DBiamFindPersonenuebersichtByPersonIdParams = {
                        personId: faker.string.uuid(),
                    };
                    const person: Person<true> = createPerson();
                    const rolle: Rolle<true> = DoFactory.createRolle(true);
                    const rollenMap: Map<string, Rolle<true>> = new Map();
                    rollenMap.set(faker.string.numeric(), rolle); //rolle will not be found with correct id
                    const orga: OrganisationDo<true> = DoFactory.createOrganisation(true);
                    const orgaMap: Map<string, OrganisationDo<true>> = new Map();
                    orgaMap.set(orga.id, orga);
                    const pk: Personenkontext<true> = createPersonenkontext(true, {
                        personId: person.id,
                        rolleId: rolle.id,
                        organisationId: orga.id,
                    });

                    personRepositoryMock.findById.mockResolvedValueOnce(person);
                    dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk]);
                    rolleRepoMock.findByIds.mockResolvedValueOnce(rollenMap);
                    organisationRepositoryMock.findByIds.mockResolvedValueOnce(orgaMap);

                    await expect(sut.findPersonenuebersichtenByPerson(params)).rejects.toThrow(HttpException);
                });
            });
        });
    });
});
