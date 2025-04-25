import { BaseEvent } from '../base-event.js';
import { EmailAddressAlreadyExistsEvent } from './email-address-already-exists.event.js';

describe('EmailAddressAlreadyExistsEvent', () => {
    it('should correctly initialize with personId and orgaKennung', () => {
        const personId: string = 'test-person-id';
        const orgaKennung: string = 'test-orga-kennung';

        const event: EmailAddressAlreadyExistsEvent = new EmailAddressAlreadyExistsEvent(personId, orgaKennung);

        // Assert
        expect(event.personId).toBe(personId);
        expect(event.orgaKennung).toBe(orgaKennung);
    });

    it('should extend BaseEvent', () => {
        const event: EmailAddressAlreadyExistsEvent = new EmailAddressAlreadyExistsEvent('person-id', 'orga-kennung');

        expect(event).toBeInstanceOf(Object);
        expect(event).toBeInstanceOf(BaseEvent);
    });
});
