import { DoFactory } from '../../../../test/utils/do-factory.js';
import { PersonenkontextDo } from '../../personenkontext/domain/personenkontext.do.js';
import { PersonInfoResponse } from '../api/person-info.response.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonApiMapper } from './person-api.mapper.js';

describe('PersonApiMapper', () => {
    let sut: PersonApiMapper;

    beforeAll(() => {
        sut = new PersonApiMapper();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('toPersonInfoResponse', () => {
        describe('when mapping to PersonInfoResponse', () => {
            it('should return PersonInfoResponse', () => {
                // Arrange
                const person: PersonDo<true> = DoFactory.createPerson(true);
                const kontext: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);
                const kontexte: PersonenkontextDo<true>[] = [kontext];

                // Act
                const result: PersonInfoResponse = sut.mapToPersonInfoResponse(person, kontexte);

                // Assert
                expect(result).toBeInstanceOf(PersonInfoResponse);
                expect(result).toEqual<PersonInfoResponse>({
                    pid: person.id,
                    person: {
                        id: person.id,
                        referrer: person.referrer,
                        mandant: person.mandant,
                        name: {
                            titel: person.nameTitel,
                            anrede: person.nameAnrede,
                            vorname: person.vorname,
                            familiennamen: person.familienname,
                            initialenfamilienname: person.initialenFamilienname,
                            initialenvorname: person.initialenVorname,
                            rufname: person.rufname,
                            namenspraefix: person.namePraefix,
                            namenssuffix: person.nameSuffix,
                            sortierindex: person.nameSortierindex,
                        },
                        geburt: {
                            datum: person.geburtsdatum,
                            geburtsort: person.geburtsort,
                        },
                        stammorganisation: person.stammorganisation,
                        geschlecht: person.geschlecht,
                        lokalisierung: person.lokalisierung,
                        vertrauensstufe: person.vertrauensstufe,
                        revision: person.revision,
                    },
                    personenkontexte: [
                        {
                            id: kontext.id,
                            referrer: kontext.referrer,
                            mandant: kontext.mandant,
                            organisation: {
                                id: kontext.organisation.id,
                            },
                            rolle: kontext.rolle,
                            personenstatus: kontext.personenstatus,
                            jahrgangsstufe: kontext.jahrgangsstufe,
                            sichtfreigabe: kontext.sichtfreigabe,
                            loeschung: kontext.loeschungZeitpunkt
                                ? { zeitpunkt: kontext.loeschungZeitpunkt }
                                : undefined,
                            revision: kontext.revision,
                        },
                    ],
                    gruppen: [],
                });
            });
        });
    });
});
