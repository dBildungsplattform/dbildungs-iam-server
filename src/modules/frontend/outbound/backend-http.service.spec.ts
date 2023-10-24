import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { HttpException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosError } from 'axios';
import { TokenSet } from 'openid-client';
import { firstValueFrom, throwError } from 'rxjs';

import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { BackendHttpService } from './backend-http.service.js';

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
            const tokens: TokenSet = new TokenSet({ access_token: accessToken });

            sut.get(endpoint, tokens);

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
            const tokens: TokenSet = new TokenSet({ access_token: accessToken });

            sut.post(endpoint, data, tokens);

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
            const tokens: TokenSet = new TokenSet({ access_token: accessToken });

            sut.patch(endpoint, data, tokens);

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
            const tokens: TokenSet = new TokenSet({ access_token: accessToken });

            sut.delete(endpoint, tokens);

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
            const tokens: TokenSet = new TokenSet({ access_token: accessToken });

            sut.put(endpoint, data, tokens);

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
            const tokens: TokenSet = new TokenSet({ access_token: accessToken });

            sut.head(endpoint, tokens);

            expect(httpServiceMock.head).toHaveBeenCalledWith(
                expect.stringContaining(endpoint),
                expect.objectContaining({ headers: { Authorization: `Bearer ${accessToken}` } }),
            );
        });
    });

    describe('error handling', () => {
        it('should transform AxiosError with response to HttpException', async () => {
            const errorMock: AxiosError = createMock<AxiosError>({
                response: { status: faker.internet.httpStatusCode(), data: { message: 'Error' } },
            });
            httpServiceMock.get.mockReturnValueOnce(throwError(() => errorMock));

            await expect(firstValueFrom(sut.get('', createMock<TokenSet>()))).rejects.toThrow(HttpException);
        });

        it('should transform AxiosError without response to InternalServerErrorException', async () => {
            const errorMock: AxiosError = createMock<AxiosError>({
                response: undefined,
            });
            httpServiceMock.get.mockReturnValueOnce(throwError(() => errorMock));

            await expect(firstValueFrom(sut.get('', createMock<TokenSet>()))).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });
});
