import { Test, TestingModule } from '@nestjs/testing';
import { UiBackendExceptionFilter } from './ui-backend-exception-filter.js';
import { KeycloakClientError } from '../../../shared/error/index.js';

const mockJson = jest.fn();
const mockUrl = jest.fn().mockImplementation(() => ({
    url: mockUrl,
}));
const mockStatus = jest.fn().mockImplementation(() => ({
    json: mockJson,
}));
const mockGetRequest = jest.fn().mockImplementation(() => ({
    url: mockUrl,
}));
const mockGetResponse = jest.fn().mockImplementation(() => ({
    status: mockStatus,
}));
const mockHttpArgumentsHost = jest.fn().mockImplementation(() => ({
    getResponse: mockGetResponse,
    getRequest: mockGetRequest,
}));

const mockArgumentsHost = {
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
