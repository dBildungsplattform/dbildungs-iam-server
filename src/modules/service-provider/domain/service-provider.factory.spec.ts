import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { expectErrResult, expectOkResult } from '../../../../test/utils/test-types.js';
import { LogoOrLogoIdError } from './errors/logo-or-logo-id.error.js';
import { ServiceProviderFactory } from './service-provider.factory.js';
import { ServiceProvider } from './service-provider.js';

describe('ServiceProviderFactory', () => {
    let module: TestingModule;
    let sut: ServiceProviderFactory;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [],
            providers: [ServiceProviderFactory],
        }).compile();
        sut = module.get(ServiceProviderFactory);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('construct', () => {
        const example: ServiceProvider<true> = DoFactory.createServiceProvider(true);

        describe('when construct is called on factory', () => {
            it('should return new instance', () => {
                const serviceProvider: Result<ServiceProvider<true>, LogoOrLogoIdError> = sut.construct(
                    example.id,
                    example.createdAt,
                    example.updatedAt,
                    example.name,
                    example.target,
                    example.url,
                    example.kategorie,
                    example.providedOnSchulstrukturknoten,
                    example.logoId,
                    example.logo,
                    example.logoMimeType,
                    example.keycloakGroup,
                    example.keycloakRole,
                    example.externalSystem,
                    example.requires2fa,
                    example.vidisAngebotId,
                    example.merkmale,
                );
                expectOkResult(serviceProvider);
                expect(serviceProvider.value).toEqual(example);
            });
        });

        describe('when logo and logoId are provided', () => {
            it('should return an error', () => {
                const serviceProvider: Result<ServiceProvider<true>, LogoOrLogoIdError> = sut.construct(
                    example.id,
                    example.createdAt,
                    example.updatedAt,
                    example.name,
                    example.target,
                    example.url,
                    example.kategorie,
                    example.providedOnSchulstrukturknoten,
                    faker.number.int({ min: 0, max: 1000 }),
                    example.logo,
                    example.logoMimeType,
                    example.keycloakGroup,
                    example.keycloakRole,
                    example.externalSystem,
                    example.requires2fa,
                    example.vidisAngebotId,
                    example.merkmale,
                );
                expectErrResult(serviceProvider);
                expect(serviceProvider.error).toBeInstanceOf(LogoOrLogoIdError);
            });
        });
    });

    describe('createNew', () => {
        const example: ServiceProvider<false> = DoFactory.createServiceProvider(false, {
            id: undefined,
            createdAt: undefined,
            updatedAt: undefined,
        });

        describe('when createNew is called on factory', () => {
            it('should return new instance', () => {
                const serviceProvider: Result<ServiceProvider<false>, LogoOrLogoIdError> = sut.createNew(
                    example.name,
                    example.target,
                    example.url,
                    example.kategorie,
                    example.providedOnSchulstrukturknoten,
                    example.logoId,
                    example.logo,
                    example.logoMimeType,
                    example.keycloakGroup,
                    example.keycloakRole,
                    example.externalSystem,
                    example.requires2fa,
                    example.vidisAngebotId,
                    example.merkmale,
                );
                expectOkResult(serviceProvider);
                expect(serviceProvider.value).toEqual(example);
            });
        });

        describe('when logo and logoId are provided', () => {
            it('should return an error', () => {
                const serviceProvider: Result<ServiceProvider<false>, LogoOrLogoIdError> = sut.createNew(
                    example.name,
                    example.target,
                    example.url,
                    example.kategorie,
                    example.providedOnSchulstrukturknoten,
                    faker.number.int({ min: 0, max: 1000 }),
                    example.logo,
                    example.logoMimeType,
                    example.keycloakGroup,
                    example.keycloakRole,
                    example.externalSystem,
                    example.requires2fa,
                    example.vidisAngebotId,
                    example.merkmale,
                );
                expectErrResult(serviceProvider);
                expect(serviceProvider.error).toBeInstanceOf(LogoOrLogoIdError);
            });
        });
    });
});
