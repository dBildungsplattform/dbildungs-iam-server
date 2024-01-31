import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { SessionSerializer } from './session.serializer.js';

describe('SessionSerializer', () => {
    let module: TestingModule;
    let sut: SessionSerializer;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [SessionSerializer],
        }).compile();

        sut = module.get(SessionSerializer);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('serializeUser', () => {
        it('should pass user to callback', () => {
            const done: jest.Mock = jest.fn();
            const user: object = createMock();

            sut.serializeUser(user, done);

            expect(done).toHaveBeenCalledWith(null, user);
        });
    });

    describe('deserializeUser', () => {
        it('should pass payload to callback', () => {
            const done: jest.Mock = jest.fn();
            const payload: object = createMock();

            sut.deserializeUser(payload, done);

            expect(done).toHaveBeenCalledWith(null, payload);
        });
    });
});
