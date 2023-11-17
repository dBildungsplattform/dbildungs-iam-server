import { ClassLogger } from './class-logger.js';
import { Test, TestingModule } from '@nestjs/testing';
import { ModuleLogger } from './module-logger.js';
import { createMock } from '@golevelup/ts-jest';

describe('ClassLogger', () => {
    let loggerModule: TestingModule;

    let moduleLogger: ModuleLogger;

    beforeEach(async () => {
        moduleLogger = createMock<ModuleLogger>();
        loggerModule = await Test.createTestingModule({
            providers: [ClassLogger, { provide: ModuleLogger, useValue: moduleLogger }],
        }).compile();
    });

    afterEach(async () => {
        await loggerModule.close();
    });

    describe('when a message is logged', () => {
        it('should log appropriately for level debug', async () => {
            const classLogger: ClassLogger = await loggerModule.resolve(ClassLogger);

            classLogger.debug('Blah');

            expect(moduleLogger.getLogger().debug).toHaveBeenCalledTimes(1);
        });

        it('should log appropriately for level notice', async () => {
            const classLogger: ClassLogger = await loggerModule.resolve(ClassLogger);

            classLogger.notice('Blah');

            expect(moduleLogger.getLogger().notice).toHaveBeenCalledTimes(1);
        });

        it('should log appropriately for level info', async () => {
            const classLogger: ClassLogger = await loggerModule.resolve(ClassLogger);

            classLogger.info('Blah');

            expect(moduleLogger.getLogger().info).toHaveBeenCalledTimes(1);
        });

        it('should log appropriately for level warning', async () => {
            const classLogger: ClassLogger = await loggerModule.resolve(ClassLogger);

            classLogger.warning('Blah');

            expect(moduleLogger.getLogger().warning).toHaveBeenCalledTimes(1);
        });

        it('should log appropriately for level alert', async () => {
            const classLogger: ClassLogger = await loggerModule.resolve(ClassLogger);

            classLogger.alert('Blah');

            expect(moduleLogger.getLogger().alert).toHaveBeenCalledTimes(1);
        });

        it('should log appropriately for level error', async () => {
            const classLogger: ClassLogger = await loggerModule.resolve(ClassLogger);

            classLogger.error('Blah');

            expect(moduleLogger.getLogger().error).toHaveBeenCalledTimes(1);
        });

        it('should log appropriately for level crit', async () => {
            const classLogger: ClassLogger = await loggerModule.resolve(ClassLogger);

            classLogger.crit('Blah');

            expect(moduleLogger.getLogger().crit).toHaveBeenCalledTimes(1);
        });

        it('should log appropriately for level emerg', async () => {
            const classLogger: ClassLogger = await loggerModule.resolve(ClassLogger);

            classLogger.emerg('Blah');

            expect(moduleLogger.getLogger().emerg).toHaveBeenCalledTimes(1);
        });
    });

    describe('when a message with a trace was logged', () => {
        it('should take the trace into account', async () => {
            const classLogger: ClassLogger = await loggerModule.resolve(ClassLogger);

            classLogger.debug('Blah2', 'TraceInfo');

            expect(moduleLogger.getLogger().debug).toHaveBeenCalledTimes(1);
        });
    });
});
