import { faker } from '@faker-js/faker';
import { DoFactory } from '../../../../test/utils';
import { UpdateServiceProviderBodyParams } from '../api/update-service-provider-body.params';
import { InvalidLogoCombinationError } from './errors/invalid-logo-combination.error';
import { ServiceProvider } from './service-provider';
import { ServiceProviderKategorie } from './service-provider.enum';

describe('ServiceProvider', () => {
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
