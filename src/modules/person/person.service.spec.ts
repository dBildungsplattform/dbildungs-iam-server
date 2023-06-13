import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DomainError, EntityFactory, MapperTestModule, PersonAlreadyExistsError } from '../../shared/index.js';
import { PersonDo } from './person.do.js';
import { PersonEntity } from './person.entity.js';
import { PersonRepo } from './person.repo.js';
import { PersonService } from './person.service.js';

describe('PersonService', () => {
    let module: TestingModule;
    let personService: PersonService;
    let personRepoMock: DeepMocked<PersonRepo>;

    const [personMock] = EntityFactory.createPersons(1);

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                PersonService,
                {
                    provide: PersonService,
                    useValue: createMock<PersonRepo>(),
                },
            ],
        }).compile();
        personService = module.get(PersonService);
        personRepoMock = module.get(PersonRepo);
    });

    afterAll(async () => {
        await module.close();
    });

    describe('when person not exists', () => {
        it('should create user', async () => {
            personRepoMock.findByReferrer.mockResolvedValueOnce(null);
            const result = await personService.createPerson({
                firstName: personMock?.firstName as string,
                lastName: personMock?.lastName as string,
            });
            expect(result).toEqual<Result<PersonDo, DomainError>>({
                ok: true,
                value: new PersonDo(personMock as PersonEntity),
            });
        });
    });

    describe('when person already exists', () => {
        it('should return domain error', async () => {
            personRepoMock.findByReferrer.mockResolvedValueOnce(personMock);
            const result = await personService.createPerson({
                firstName: personMock?.firstName as string,
                lastName: personMock?.lastName as string,
            });
            expect(result).toEqual<Result<PersonDo, DomainError>>({
                ok: false,
                error: new PersonAlreadyExistsError(`Person with referrer ${personMock?.referrer as string}`),
            });
        });
    });
});
