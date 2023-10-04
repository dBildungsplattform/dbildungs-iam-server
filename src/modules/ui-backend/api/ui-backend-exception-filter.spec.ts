import { Test, TestingModule } from '@nestjs/testing';
import { UiBackendExceptionFilter } from './ui-backend-exception-filter.js';
import { KeycloakClientError } from '../../../shared/error/index.js';
import Mock = jest.Mock;
import { ArgumentsHost } from '@nestjs/common';

const mockJson: Mock = jest.fn();
const mockUrl: Mock = jest.fn().mockImplementation(() => ({
    url: mockUrl,
}));
const mockStatus: Mock = jest.fn().mockImplementation(() => ({
    json: mockJson,
}));
const mockGetRequest: Mock = jest.fn().mockImplementation(() => ({
    url: mockUrl,
}));
const mockGetResponse: Mock = jest.fn().mockImplementation(() => ({
    status: mockStatus,
}));
const mockHttpArgumentsHost: Mock = jest.fn().mockImplementation(() => ({
    getResponse: mockGetResponse,
    getRequest: mockGetRequest,
}));

const mockArgumentsHost: ArgumentsHost = {
    switchToHttp: mockHttpArgumentsHost,
    getArgByIndex: jest.fn(),
    getArgs: jest.fn(),
    getType: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
};

describe('System header validation service', () => {
    let service: UiBackendExceptionFilter<KeycloakClientError>;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [UiBackendExceptionFilter],
        }).compile();
        service = module.get<UiBackendExceptionFilter<KeycloakClientError>>(UiBackendExceptionFilter);
    });

    describe('UI Backend exception filter tests', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });

        it('Http exception', () => {
            service.catch(new KeycloakClientError(''), mockArgumentsHost);
            expect(mockHttpArgumentsHost).toBeCalledTimes(1);
            expect(mockHttpArgumentsHost).toBeCalledWith();
            expect(mockGetResponse).toBeCalledTimes(1);
            expect(mockGetResponse).toBeCalledWith();
            expect(mockStatus).toBeCalledTimes(1);
            expect(mockJson).toBeCalledTimes(1);
        });
    });
});
