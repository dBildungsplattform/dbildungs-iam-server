import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { HttpException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosError, AxiosResponse } from 'axios';
import { firstValueFrom, of, throwError } from 'rxjs';

import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { User } from '../auth/user.decorator.js';
import { BackendHttpService } from './backend-http.service.js';
import { PaginatedResponseDto } from '../api/paginated-data.response.js';

describe('BackendHttpService', () => {
    let module: TestingModule;
    let sut: BackendHttpService;
    let httpServiceMock: DeepMocked<HttpService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [BackendHttpService, { provide: HttpService, useValue: createMock<HttpService>() }],
        }).compile();

        sut = module.get(BackendHttpService);
        httpServiceMock = module.get(HttpService);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('get', () => {
        it('should call HttpService.get with correct arguments', () => {
            const endpoint: string = faker.string.alphanumeric(32);
            const accessToken: string = faker.string.alphanumeric(32);
            const user: User = createMock<User>({ access_token: accessToken });

            sut.get(endpoint, user);

            expect(httpServiceMock.get).toHaveBeenCalledWith(
                expect.stringContaining(endpoint),
                expect.objectContaining({ headers: { Authorization: `Bearer ${accessToken}` } }),
            );
        });
    });

    describe('post', () => {
        it('should call HttpService.post with correct arguments', () => {
            const endpoint: string = faker.string.alphanumeric(32);
            const accessToken: string = faker.string.alphanumeric(32);
            const data: unknown = {};
            const user: User = createMock<User>({ access_token: accessToken });

            sut.post(endpoint, data, user);

            expect(httpServiceMock.post).toHaveBeenCalledWith(
                expect.stringContaining(endpoint),
                data,
                expect.objectContaining({ headers: { Authorization: `Bearer ${accessToken}` } }),
            );
        });
    });

    describe('patch', () => {
        it('should call HttpService.patch with correct arguments', () => {
            const endpoint: string = faker.string.alphanumeric(32);
            const accessToken: string = faker.string.alphanumeric(32);
            const data: unknown = {};
            const user: User = createMock<User>({ access_token: accessToken });

            sut.patch(endpoint, data, user);

            expect(httpServiceMock.patch).toHaveBeenCalledWith(
                expect.stringContaining(endpoint),
                data,
                expect.objectContaining({ headers: { Authorization: `Bearer ${accessToken}` } }),
            );
        });
    });

    describe('delete', () => {
        it('should call HttpService.delete with correct arguments', () => {
            const endpoint: string = faker.string.alphanumeric(32);
            const accessToken: string = faker.string.alphanumeric(32);
            const user: User = createMock<User>({ access_token: accessToken });

            sut.delete(endpoint, user);

            expect(httpServiceMock.delete).toHaveBeenCalledWith(
                expect.stringContaining(endpoint),
                expect.objectContaining({ headers: { Authorization: `Bearer ${accessToken}` } }),
            );
        });
    });

    describe('put', () => {
        it('should call HttpService.put with correct arguments', () => {
            const endpoint: string = faker.string.alphanumeric(32);
            const accessToken: string = faker.string.alphanumeric(32);
            const data: unknown = {};
            const user: User = createMock<User>({ access_token: accessToken });

            sut.put(endpoint, data, user);

            expect(httpServiceMock.put).toHaveBeenCalledWith(
                expect.stringContaining(endpoint),
                data,
                expect.objectContaining({ headers: { Authorization: `Bearer ${accessToken}` } }),
            );
        });
    });

    describe('head', () => {
        it('should call HttpService.head with correct arguments', () => {
            const endpoint: string = faker.string.alphanumeric(32);
            const accessToken: string = faker.string.alphanumeric(32);
            const user: User = createMock<User>({ access_token: accessToken });

            sut.head(endpoint, user);

            expect(httpServiceMock.head).toHaveBeenCalledWith(
                expect.stringContaining(endpoint),
                expect.objectContaining({ headers: { Authorization: `Bearer ${accessToken}` } }),
            );
        });
    });

    describe('getPaginated', () => {
        it('should call HttpService.get with correct arguments', () => {
            const endpoint: string = faker.string.alphanumeric(32);
            const accessToken: string = faker.string.alphanumeric(32);
            const user: User = createMock<User>({ access_token: accessToken });
            httpServiceMock.get.mockReturnValueOnce(of({} as AxiosResponse));

            sut.getPaginated(endpoint, user);

            expect(httpServiceMock.get).toHaveBeenCalledWith(
                expect.stringContaining(endpoint),
                expect.objectContaining({ headers: { Authorization: `Bearer ${accessToken}` } }),
            );
        });

        it('should map response to PaginatedResponseDto', async () => {
            const endpoint: string = faker.string.alphanumeric(32);
            const accessToken: string = faker.string.alphanumeric(32);
            const user: User = createMock<User>({ access_token: accessToken });
            const axiosResponse: AxiosResponse = {
                data: {},
                headers: {
                    'x-paging-offset': 1,
                    'x-paging-limit': 2,
                    'x-paging-total': 3,
                },
            } as unknown as AxiosResponse;
            httpServiceMock.get.mockReturnValueOnce(of(axiosResponse));

            const response: PaginatedResponseDto<unknown> = await firstValueFrom(sut.getPaginated(endpoint, user));

            expect(response).toBeInstanceOf(PaginatedResponseDto);
        });
    });

    describe('error handling', () => {
        it('should transform AxiosError with response to HttpException', async () => {
            const errorMock: AxiosError = createMock<AxiosError>({
                response: { status: faker.internet.httpStatusCode(), data: { message: 'Error' } },
            });
            httpServiceMock.get.mockReturnValueOnce(throwError(() => errorMock));

            await expect(firstValueFrom(sut.get('', createMock<User>()))).rejects.toThrow(HttpException);
        });

        it('should transform AxiosError without response to InternalServerErrorException', async () => {
            const errorMock: AxiosError = createMock<AxiosError>({
                response: undefined,
            });
            httpServiceMock.get.mockReturnValueOnce(throwError(() => errorMock));

            await expect(firstValueFrom(sut.get('', createMock<User>()))).rejects.toThrow(InternalServerErrorException);
        });
    });
});
