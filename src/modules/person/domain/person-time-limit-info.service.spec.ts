import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { TestingModule, Test } from '@nestjs/testing';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import PersonTimeLimitService from './person-time-limit-info.service.js';
import { DBiamPersonenkontextService } from '../../personenkontext/domain/dbiam-personenkontext.service.js';
import { Person } from '../../person/domain/person.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { TimeLimitOccasion } from '../domain/time-limit-occasion.enums.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { PersonTimeLimitInfo } from './person-time-limit-info.js';
import { KOPERS_DEADLINE_IN_DAYS } from './person-time-limit.js';

describe('PersonTimeLimitService', () => {
    let module: TestingModule;
    let sut: PersonTimeLimitService;
    let personRepoMock: DeepMocked<PersonRepository>;
    let dBiamPersonenkontextServiceMock: DeepMocked<DBiamPersonenkontextService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                PersonTimeLimitService,
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
                {
                    provide: DBiamPersonenkontextService,
                    useValue: createMock<DBiamPersonenkontextService>(),
                },
            ],
        }).compile();
        sut = module.get(PersonTimeLimitService);
        personRepoMock = module.get(PersonRepository);
        dBiamPersonenkontextServiceMock = module.get(DBiamPersonenkontextService);
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

    describe('getPersonTimeLimitInfo', () => {
        it('should return PersonTimeLimitInfo array', async () => {
            const person: Person<true> = DoFactory.createPerson(true);
            person.personalnummer = undefined;
            personRepoMock.findById.mockResolvedValue(person);

            dBiamPersonenkontextServiceMock.isPersonalnummerRequiredForAnyPersonenkontextForPerson.mockResolvedValue(
                true,
            );
            const pesonenkontext: Personenkontext<true> = DoFactory.createPersonenkontext(true);
            dBiamPersonenkontextServiceMock.getKopersPersonenkontext.mockResolvedValue(pesonenkontext);

            const result: PersonTimeLimitInfo[] = await sut.getPersonTimeLimitInfo(person.id);

            const expectedDeadline: Date = new Date(pesonenkontext.createdAt);
            expectedDeadline.setDate(expectedDeadline.getDate() + KOPERS_DEADLINE_IN_DAYS);

            expect(result).toEqual<PersonTimeLimitInfo[]>([
                {
                    occasion: TimeLimitOccasion.KOPERS,
                    deadline: expectedDeadline,
                },
            ]);
        });

        it('should return empty array when person isnt found ', async () => {
            personRepoMock.findById.mockResolvedValue(null);
            const result: PersonTimeLimitInfo[] = await sut.getPersonTimeLimitInfo('');

            expect(result).toEqual<PersonTimeLimitInfo[]>([]);
        });
    });
});
