import { IdIncludedWithPayload } from './id-included-with-payload.error.js';

describe('IdWasSentWithPayload', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: IdIncludedWithPayload = new IdIncludedWithPayload('ID was sent with the payload');
                expect(error.message).toBe('ID was sent with the payload');
                expect(error.code).toBe('ID_WAS_SENT_WITH_PAYLOAD');
            });
        });
    });
});
