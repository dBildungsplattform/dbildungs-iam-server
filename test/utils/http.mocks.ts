import { faker } from '@faker-js/faker/locale/af_ZA';
import { ArgumentsHost, ExecutionContext } from '@nestjs/common';
import { Response, Request } from 'express';
import { Session } from 'express-session';
import { MockedObject } from 'vitest';

export function createResponseMock(): MockedObject<Response> {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
        setHeader: vi.fn().mockReturnThis(),
        redirect: vi.fn(),
        // Add other methods and properties of Response as needed
    } as MockedObject<Response>;
}

export interface RequestMockOptions {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user?: any;
    accessTokenJWT?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    passportUser?: any;
    headers?: Record<string, string>;
    session?: Session | MockedObject<Session>;
}

export function createRequestMock(options?: RequestMockOptions): MockedObject<Request> {
    return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        user: options?.user,
        accessTokenJWT: options?.accessTokenJWT ?? faker.string.uuid(),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        passportUser: options?.passportUser,
        isAuthenticated: vi.fn().mockReturnValue(false),
        logout: vi.fn(),
        query: {},
        session: options?.session ?? ({ destroy: vi.fn() } as unknown as MockedObject<Session>),
        headers: options?.headers ?? {},
        // Add other methods and properties of Response as needed
    } as unknown as MockedObject<Request>;
}

interface ArgumentsHostMockOptions {
    response?: MockedObject<Response>;
    request?: MockedObject<Request>;
}

export function createExecutionContextMock(options?: ArgumentsHostMockOptions): MockedObject<ExecutionContext> {
    return {
        switchToHttp: vi.fn().mockReturnValue({
            getResponse: vi.fn().mockReturnValue(options?.response ?? createResponseMock()),
            getRequest: vi.fn().mockReturnValue(options?.request ?? createRequestMock()),
        }),
        getClass: vi.fn(),
        getHandler: vi.fn(),
    } as MockedObject<ExecutionContext>;
}

export function createArgumentsHostMock(options?: ArgumentsHostMockOptions): MockedObject<ArgumentsHost> {
    return createExecutionContextMock(options) as MockedObject<ArgumentsHost>;
}
