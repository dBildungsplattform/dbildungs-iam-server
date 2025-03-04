import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'winston';
import { ConfigTestModule } from '../../../test/utils/index.js';
import { ClassLogger } from './class-logger.js';
import { LoggerModule } from './logger.module.js';
import { ModuleLogger } from './module-logger.js';
import { EntityNotFoundError } from '../../shared/error/entity-not-found.error.js';
import { inspect } from 'util';

describe('ClassLogger', () => {
    let module: TestingModule;
    let sut: ClassLogger;

    const loggerMock: DeepMocked<Logger> = createMock<Logger>();
    const testModuleName: string = 'TestModule';
    const createTestMessage: (message: string, trace?: unknown) => Record<string, unknown> = (
        message: string,
        trace?: unknown,
    ) => ({
        context: `${testModuleName}.${ClassLogger.name}`,
        message,
        trace,
    });

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggerModule.register(testModuleName), ConfigTestModule],
        })
            .overrideProvider(ModuleLogger)
            .useValue(
                createMock<ModuleLogger>({
                    moduleName: testModuleName,
                    getLogger: () => loggerMock,
                }),
            )
            .compile();
        sut = await module.resolve(ClassLogger);
    });

    afterEach(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('when a message is logged', () => {
        it('should log appropriately for level debug', () => {
            sut.debug('Blah');

            expect(loggerMock.log).toHaveBeenCalledTimes(1);
            expect(loggerMock.log).toHaveBeenCalledWith('debug', createTestMessage('Blah'));
        });

        it('should log appropriately for level notice', () => {
            sut.notice('Blah');

            expect(loggerMock.log).toHaveBeenCalledTimes(1);
            expect(loggerMock.log).toHaveBeenCalledWith('notice', createTestMessage('Blah'));
        });

        it('should log appropriately for level info', () => {
            sut.info('Blah');

            expect(loggerMock.log).toHaveBeenCalledTimes(1);
            expect(loggerMock.log).toHaveBeenCalledWith('info', createTestMessage('Blah'));
        });

        it('should log appropriately for level warning', () => {
            sut.warning('Blah');

            expect(loggerMock.log).toHaveBeenCalledTimes(1);
            expect(loggerMock.log).toHaveBeenCalledWith('warning', createTestMessage('Blah'));
        });

        it('should log appropriately for level alert', () => {
            sut.alert('Blah');

            expect(loggerMock.log).toHaveBeenCalledTimes(1);
            expect(loggerMock.log).toHaveBeenCalledWith('alert', createTestMessage('Blah'));
        });

        it('should log appropriately for level error', () => {
            sut.error('Blah');

            expect(loggerMock.log).toHaveBeenCalledTimes(1);
            expect(loggerMock.log).toHaveBeenCalledWith('error', createTestMessage('Blah'));
        });

        it('should log appropriately for level crit', () => {
            sut.crit('Blah');

            expect(loggerMock.log).toHaveBeenCalledTimes(1);
            expect(loggerMock.log).toHaveBeenCalledWith('crit', createTestMessage('Blah'));
        });

        it('should log appropriately for level emerg', () => {
            sut.emerg('Blah');

            expect(loggerMock.log).toHaveBeenCalledTimes(1);
            expect(loggerMock.log).toHaveBeenCalledWith('emerg', createTestMessage('Blah'));
        });
    });

    describe('when a message with a trace was logged', () => {
        it('should take the trace into account for level debug', () => {
            sut.debug('Blah2', 'TraceInfo');

            expect(loggerMock.log).toHaveBeenCalledTimes(1);
            expect(loggerMock.log).toHaveBeenCalledWith('debug', createTestMessage('Blah2', 'TraceInfo'));
        });

        // AI next 40 lines
        it('should take the trace into account for level notice', () => {
            sut.notice('Blah2', 'TraceInfo');

            expect(loggerMock.log).toHaveBeenCalledTimes(1);
            expect(loggerMock.log).toHaveBeenCalledWith('notice', createTestMessage('Blah2', 'TraceInfo'));
        });

        it('should take the trace into account for level info', () => {
            sut.info('Blah2', 'TraceInfo');

            expect(loggerMock.log).toHaveBeenCalledTimes(1);
            expect(loggerMock.log).toHaveBeenCalledWith('info', createTestMessage('Blah2', 'TraceInfo'));
        });

        it('should take the trace into account for level warning', () => {
            sut.warning('Blah2', 'TraceInfo');

            expect(loggerMock.log).toHaveBeenCalledTimes(1);
            expect(loggerMock.log).toHaveBeenCalledWith('warning', createTestMessage('Blah2', 'TraceInfo'));
        });

        it('should take the trace into account for level alert', () => {
            sut.alert('Blah2', 'TraceInfo');

            expect(loggerMock.log).toHaveBeenCalledTimes(1);
            expect(loggerMock.log).toHaveBeenCalledWith('alert', createTestMessage('Blah2', 'TraceInfo'));
        });

        it('should take the trace into account for level error', () => {
            sut.error('Blah2', 'TraceInfo');

            expect(loggerMock.log).toHaveBeenCalledTimes(1);
            expect(loggerMock.log).toHaveBeenCalledWith('error', createTestMessage('Blah2', 'TraceInfo'));
        });

        it('should take the trace into account for level crit', () => {
            sut.crit('Blah2', 'TraceInfo');

            expect(loggerMock.log).toHaveBeenCalledTimes(1);
            expect(loggerMock.log).toHaveBeenCalledWith('crit', createTestMessage('Blah2', 'TraceInfo'));
        });

        it('should take the trace into account for level emerg', () => {
            sut.emerg('Blah2', 'TraceInfo');

            expect(loggerMock.log).toHaveBeenCalledTimes(1);
            expect(loggerMock.log).toHaveBeenCalledWith('emerg', createTestMessage('Blah2', 'TraceInfo'));
        });
    });

    describe('logUnknownAsError', () => {
        const errorMessage: string = 'error-message';

        describe('when err type is NOT Error', () => {
            const unknownError: unknown = 'I am a string, not an instance of Error';

            it('should call util.inspect(err) for serialization', () => {
                sut.logUnknownAsError(errorMessage, unknownError);

                expect(loggerMock.log).toHaveBeenCalledWith('error', errorMessage);
                expect(loggerMock.log).toHaveBeenCalledWith('error', inspect(unknownError, false, 2, false));
            });
        });

        describe('when err type is Error', () => {
            const entityNotFoundError: EntityNotFoundError = new EntityNotFoundError();

            it('should get message and stack from Error-instance', () => {
                sut.logUnknownAsError(errorMessage, entityNotFoundError);

                expect(loggerMock.log).toHaveBeenCalledWith('error', errorMessage);
                expect(loggerMock.log).toHaveBeenCalledWith(
                    'error',
                    `ERROR: msg:${entityNotFoundError.message}, stack:${entityNotFoundError.stack}`,
                );
            });
        });
    });
});
