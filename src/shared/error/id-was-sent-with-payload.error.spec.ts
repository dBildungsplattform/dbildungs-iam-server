import { IdWasSentWithPayload } from './id-was-sent-with-payload.error.js';

describe('IdWasSentWithPayload', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: IdWasSentWithPayload = new IdWasSentWithPayload('ID was sent with the payload');
                expect(error.message).toBe('ID was sent with the payload');
                expect(error.code).toBe('ID_WAS_SENT_WITH_PAYLOAD');
            });
        });
    });
});
