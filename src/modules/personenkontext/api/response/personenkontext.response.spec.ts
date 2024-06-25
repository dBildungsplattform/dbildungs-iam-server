import { faker } from '@faker-js/faker';
import { PersonenkontextResponse } from './personenkontext.response.js';
import { LoeschungResponse } from '../../../person/api/loeschung.response.js';
import { Rolle } from '../../domain/personenkontext.enums.js';

describe('PersonenkontextResponse', () => {
    describe('constructor', () => {
        describe('when setting loeschung prop', () => {
            it('should create instance of LoeschungResponse', () => {
                // Arrange
                const props: PersonenkontextResponse = {
                    id: faker.string.uuid(),
                    mandant: faker.string.uuid(),
                    organisation: {
                        id: faker.string.uuid(),
                    },
                    rolle: Rolle.LEHRENDER,
                    revision: faker.string.uuid(),
                    loeschung: {
                        zeitpunkt: faker.date.recent(),
                    },
                };

                // Act
                const result: PersonenkontextResponse = PersonenkontextResponse.new(props);

                // Assert
                expect(result.loeschung).toBeInstanceOf(LoeschungResponse);
            });
        });

        describe('when setting loeschung prop to undefined', () => {
            it('should not create instance of LoeschungResponse', () => {
                // Arrange
                const props: PersonenkontextResponse = {
                    id: faker.string.uuid(),
                    mandant: faker.string.uuid(),
                    organisation: {
                        id: faker.string.uuid(),
                    },
                    rolle: Rolle.LEHRENDER,
                    revision: faker.string.uuid(),
                    loeschung: undefined,
                };

                // Act
                const result: PersonenkontextResponse = PersonenkontextResponse.new(props);

                // Assert
                expect(result.loeschung).toBeUndefined();
            });
        });
    });
});
