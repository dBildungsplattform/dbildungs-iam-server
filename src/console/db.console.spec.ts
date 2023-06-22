import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DbConsole } from './db.console.js';
import { LoggerService } from '../shared/index.js';

describe('DbConsole', () => {
    let module: TestingModule;
    let sut: DbConsole;

    const loggerServiceMock = createMock<LoggerService>();

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                DbConsole,
                {
                    provide: LoggerService,
                    useValue: loggerServiceMock,
                },
            ],
        }).compile();
        sut = module.get(DbConsole);
    });

    afterAll(async () => {
        await module.close();
    });

    describe('run', () => {
        describe('when running the db command', () => {
            it('should print reminder, that no sub command was provided', async () => {
                await expect(sut.run([])).resolves.not.toThrow();
                expect(loggerServiceMock.info).toBeCalledWith('Did you forget the sub command?');
            });
        });
    });
});
