import { PersonenkontexteUpdateResponse } from './personenkontexte-update.response.js';
import { Personenkontext } from '../../domain/personenkontext.js';
import { createMock } from '@golevelup/ts-jest';

describe('PersonenkontexteUpdateResponse', () => {
    describe('constructor', () => {
        it('should create instance', () => {
            const pk: Personenkontext<true> = createMock<Personenkontext<true>>();
            const pkUpdateResponse: PersonenkontexteUpdateResponse = new PersonenkontexteUpdateResponse([pk]);

            expect(pkUpdateResponse.dBiamPersonenkontextResponses).toHaveLength(1);
        });
    });
});
