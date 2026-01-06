import { ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { MockedObject } from 'vitest';

export function createResponseMock(): MockedObject<Response> {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
        // Add other methods and properties of Response as needed
    } as unknown as MockedObject<Response>;
}

interface ArgumentsHostMockOptions {
    response?: MockedObject<Response>;
}

export function createArgumentsHostMock(options?: ArgumentsHostMockOptions): MockedObject<ArgumentsHost> {
    return {
        switchToHttp: vi.fn().mockReturnValue({
            getResponse: vi.fn().mockReturnValue(options?.response ?? createResponseMock()),
        }),
    } as unknown as MockedObject<ArgumentsHost>;
}
