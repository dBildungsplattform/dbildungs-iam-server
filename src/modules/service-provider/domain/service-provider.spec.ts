import { faker } from '@faker-js/faker';
import { DoFactory } from '../../../../test/utils/index.js';
import { UpdateServiceProviderBodyParams } from '../api/update-service-provider-body.params.js';
import { InvalidLogoCombinationError } from './errors/invalid-logo-combination.error.js';
import { ServiceProvider } from './service-provider.js';
import { ServiceProviderKategorie } from './service-provider.enum.js';

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

describe('ServiceProvider', () => {
    describe('isValidLogoCombination', () => {
        it.each(validLogoCombinations)(
            'should return true for valid combination',
            (validLogoCombination: ValidLogoCombinationTestCase) => {
                const result: boolean = ServiceProvider.isValidLogoCombination(
                    validLogoCombination.logoId,
                    validLogoCombination.logo,
                    validLogoCombination.logoMimeType,
                );
                expect(result).toBe(true);
            },
        );

        it.each(invalidLogoCombinations)(
            'should return false if $description',
            ({ logoId, logo, logoMimeType }: InvalidLogoCombinationTestCase) => {
                const result: boolean = ServiceProvider.isValidLogoCombination(logoId, logo, logoMimeType);
                expect(result).toBe(false);
            },
        );
    });

    describe('updateWithSafeFields', () => {
        let serviceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true);

        beforeEach(() => {
            serviceProvider = DoFactory.createServiceProvider(true, {
                kategorie: ServiceProviderKategorie.HINWEISE,
                logo: undefined,
                logoMimeType: undefined,
            });
        });

        it.each([
            [
                {
                    name: faker.company.buzzNoun(),
                    url: faker.internet.url(),
                    kategorie: serviceProvider.kategorie,
                    logoId: faker.number.int({ min: 1, max: 1000 }),
                },
            ],
            [
                {
                    logoId: 1,
                },
            ],
        ])('should update only safe fields', (update: UpdateServiceProviderBodyParams) => {
            const serviceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true, {
                kategorie: ServiceProviderKategorie.HINWEISE,
                logo: undefined,
                logoMimeType: undefined,
            });
            const result: Option<InvalidLogoCombinationError> = serviceProvider.updateWithSafeFields(update);
            expect(result).toBeUndefined();
            expect(serviceProvider).toEqual({
                ...serviceProvider,
                ...update,
            });
        });

        it('should set logoId to undefined if null is provided', () => {
            const serviceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true, {
                kategorie: ServiceProviderKategorie.HINWEISE,
                logo: undefined,
                logoMimeType: undefined,
                logoId: 123,
            });
            const update: UpdateServiceProviderBodyParams = {
                logoId: null,
            };
            const result: Option<InvalidLogoCombinationError> = serviceProvider.updateWithSafeFields(update);
            expect(result).toBeUndefined();
            expect(serviceProvider).toEqual({
                ...serviceProvider,
                logoId: undefined,
            });
        });

        it.each([[1], [123]])(
            'should return an error if logoId=%s is provided when logo is already set',
            (logoId: number) => {
                const serviceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true, {
                    kategorie: ServiceProviderKategorie.HINWEISE,
                });
                const update: UpdateServiceProviderBodyParams = {
                    logoId,
                };
                const result: Option<InvalidLogoCombinationError> = serviceProvider.updateWithSafeFields(update);
                expect(result).toBeInstanceOf(InvalidLogoCombinationError);
                expect(serviceProvider.logoId).toBeUndefined();
            },
        );
    });
});
