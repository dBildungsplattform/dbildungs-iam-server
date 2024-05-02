import { Volljaehrig } from '../domain/person.enums.js';
import { PersonApiMapper } from './person-api.mapper.js';

describe('PersonApiMapper', () => {
    let sut: PersonApiMapper;

    beforeAll(() => {
        sut = new PersonApiMapper();
    });

    describe('toPersonInfoResponse', () => {});

    describe('isPersonVolljaehrig', () => {
        describe('when person is volljaehrig', () => {
            it('should return JA', () => {
                const dates: [Date, Date][] = [
                    [new Date(2000, 1, 1), new Date(2018, 1, 1)],
                    [new Date(1960, 1, 1), new Date(2018, 1, 1)],
                ];

                dates.forEach(([birthDate, now]: [Date, Date]) => {
                    const result: Volljaehrig = sut.isPersonVolljaehrig(birthDate, now);

                    expect(result).toBe(Volljaehrig.JA);
                });
            });
        });

        describe('when person is not volljaehrig', () => {
            it('should return NEIN', () => {
                const birthDate: Date = new Date(2000, 1, 1);
                const now: Date = new Date(2017, 12, 31);

                const result: Volljaehrig = sut.isPersonVolljaehrig(birthDate, now);

                expect(result).toBe(Volljaehrig.NEIN);
            });
        });

        describe('when birthDate is undefined', () => {
            it('should return NEIN', () => {
                const birthDate: Date | undefined = undefined;
                const now: Date = new Date(2017, 12, 31);

                const result: Volljaehrig = sut.isPersonVolljaehrig(birthDate, now);

                expect(result).toBe(Volljaehrig.NEIN);
            });
        });
    });
});
