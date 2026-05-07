import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { expectErrResult, expectOkResult } from '../../../../test/utils/test-types.js';
import { InvalidLogoCombinationError } from './errors/invalid-logo-combination.error.js';
import { ServiceProviderFactory } from './service-provider.factory.js';
import { ServiceProvider } from './service-provider.js';

type ValidLogoCombinationTestCase =
    | { logoId: number; logo: undefined; logoMimeType: undefined }
    | {
          logoId: undefined;
          logo: Buffer;
          logoMimeType: string;
      }
    | {
          logoId: undefined;
          logo: undefined;
          logoMimeType: undefined;
      };
interface InvalidLogoCombinationTestCase {
    description: string;
    logoId?: number;
    logo?: Buffer;
    logoMimeType?: string;
}

const validLogoCombinations: ValidLogoCombinationTestCase[] = [
    { logoId: undefined, logo: Buffer.from('fake-logo-data'), logoMimeType: 'image/png' },
    { logoId: faker.number.int({ min: 1, max: 1000 }), logo: undefined, logoMimeType: undefined },
    {
        logoId: undefined,
        logo: undefined,
        logoMimeType: undefined,
    },
];

const invalidLogoCombinations: InvalidLogoCombinationTestCase[] = [
    {
        description: 'only logoMimeType is provided',
        logoId: undefined,
        logo: undefined,
        logoMimeType: 'image/png',
    },
    {
        description: 'only logo is provided',
        logoId: undefined,
        logo: Buffer.from('fake-logo-data'),
        logoMimeType: undefined,
    },
    {
        description: 'logoMimeType and logoId are provided',
        logoId: faker.number.int({ min: 1, max: 1000 }),
        logo: undefined,
        logoMimeType: 'image/png',
    },
    {
        description: 'logo and logoId are provided',
        logoId: faker.number.int({ min: 1, max: 1000 }),
        logo: Buffer.from('fake-logo-data'),
        logoMimeType: undefined,
    },
    {
        description: 'logo, logoMimeType and logoId are provided',
        logoId: faker.number.int({ min: 1, max: 1000 }),
        logo: Buffer.from('fake-logo-data'),
        logoMimeType: 'image/png',
    },
];

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

        describe('when logo combination is valid', () => {
            it.each(validLogoCombinations)(
                'should return new instance',
                (validLogoCombination: ValidLogoCombinationTestCase) => {
                    const serviceProvider: Result<ServiceProvider<true>, InvalidLogoCombinationError> = sut.construct(
                        example.id,
                        example.createdAt,
                        example.updatedAt,
                        example.name,
                        example.target,
                        example.url,
                        example.kategorie,
                        example.providedOnSchulstrukturknoten,
                        validLogoCombination.logoId,
                        validLogoCombination.logo,
                        validLogoCombination.logoMimeType,
                        example.keycloakGroup,
                        example.keycloakRole,
                        example.externalSystem,
                        example.requires2fa,
                        example.vidisAngebotId,
                        example.merkmale,
                    );
                    expectOkResult(serviceProvider);
                    expect(serviceProvider.value).toEqual({
                        ...example,
                        ...validLogoCombination,
                    });
                },
            );
        });

        describe('when logo combination is invalid', () => {
            it.each(invalidLogoCombinations)(
                `should return an error if $description`,
                ({ logoId, logo, logoMimeType }: InvalidLogoCombinationTestCase) => {
                    const serviceProvider: Result<ServiceProvider<true>, InvalidLogoCombinationError> = sut.construct(
                        example.id,
                        example.createdAt,
                        example.updatedAt,
                        example.name,
                        example.target,
                        example.url,
                        example.kategorie,
                        example.providedOnSchulstrukturknoten,
                        logoId,
                        logo,
                        logoMimeType,
                        example.keycloakGroup,
                        example.keycloakRole,
                        example.externalSystem,
                        example.requires2fa,
                        example.vidisAngebotId,
                        example.merkmale,
                    );
                    expectErrResult(serviceProvider);
                    expect(serviceProvider.error).toBeInstanceOf(InvalidLogoCombinationError);
                },
            );
        });
    });

    describe('createNew', () => {
        const example: ServiceProvider<false> = DoFactory.createServiceProvider(false, {
            id: undefined,
            createdAt: undefined,
            updatedAt: undefined,
        });

        describe('when logo combination is valid', () => {
            it.each(validLogoCombinations)(
                'should return new instance',
                (validLogoCombination: ValidLogoCombinationTestCase) => {
                    const serviceProvider: Result<ServiceProvider<false>, InvalidLogoCombinationError> = sut.createNew(
                        example.name,
                        example.target,
                        example.url,
                        example.kategorie,
                        example.providedOnSchulstrukturknoten,
                        validLogoCombination.logoId,
                        validLogoCombination.logo,
                        validLogoCombination.logoMimeType,
                        example.keycloakGroup,
                        example.keycloakRole,
                        example.externalSystem,
                        example.requires2fa,
                        example.vidisAngebotId,
                        example.merkmale,
                    );
                    expectOkResult(serviceProvider);
                    expect(serviceProvider.value).toEqual({
                        ...example,
                        ...validLogoCombination,
                    });
                },
            );
        });

        describe('when logo combination is invalid', () => {
            it.each(invalidLogoCombinations)(
                `should return an error if $description`,
                ({ logoId, logo, logoMimeType }: InvalidLogoCombinationTestCase) => {
                    const serviceProvider: Result<ServiceProvider<false>, InvalidLogoCombinationError> = sut.createNew(
                        example.name,
                        example.target,
                        example.url,
                        example.kategorie,
                        example.providedOnSchulstrukturknoten,
                        logoId,
                        logo,
                        logoMimeType,
                        example.keycloakGroup,
                        example.keycloakRole,
                        example.externalSystem,
                        example.requires2fa,
                        example.vidisAngebotId,
                        example.merkmale,
                    );
                    expectErrResult(serviceProvider);
                    expect(serviceProvider.error).toBeInstanceOf(InvalidLogoCombinationError);
                },
            );
        });
    });
});
