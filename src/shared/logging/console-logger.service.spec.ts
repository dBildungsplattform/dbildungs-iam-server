import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleLoggerService } from './console-logger.service.js';

describe('ConsoleLoggerService', () => {
    let module: TestingModule;
    let sut: ConsoleLoggerService;

    const traceSpy = jest.spyOn(console, 'trace').mockImplementation();
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation();
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    const infoSpy = jest.spyOn(console, 'info').mockImplementation();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [ConsoleLoggerService],
        }).compile();
        sut = module.get(ConsoleLoggerService);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('trace', () => {
        describe('when receiving a message', () => {
            it('should write to console', () => {
                expect(() => sut.trace('trace')).not.toThrow();
                expect(traceSpy).toBeCalledWith('trace');
            });
        });
    });

    describe('debug', () => {
        describe('when receiving a message', () => {
            it('should write to console', () => {
                expect(() => sut.debug('debug')).not.toThrow();
                expect(debugSpy).toHaveBeenCalledWith('debug');
            });
        });
    });

    describe('log', () => {
        describe('when receiving a message', () => {
            it('should write to console', () => {
                expect(() => sut.log('log')).not.toThrow();
                expect(logSpy).toHaveBeenCalledWith('log');
            });
        });
    });

    describe('info', () => {
        describe('when receiving a message', () => {
            it('should write to console', () => {
                expect(() => sut.info('info')).not.toThrow();
                expect(infoSpy).toHaveBeenCalledWith('info');
            });
        });
    });

    describe('warn', () => {
        describe('when receiving a message', () => {
            it('should write to console', () => {
                expect(() => sut.warn('warn')).not.toThrow();
                expect(warnSpy).toHaveBeenCalledWith('warn');
            });
        });
    });

    describe('error', () => {
        describe('when receiving a message', () => {
            it('should write to console', () => {
                expect(() => sut.error('error')).not.toThrow();
                expect(errorSpy).toHaveBeenCalledWith('error');
            });
        });
    });
});
