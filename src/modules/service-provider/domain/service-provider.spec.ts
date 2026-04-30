import { faker } from '@faker-js/faker';
import { DoFactory } from '../../../../test/utils';
import { UpdateServiceProviderBodyParams } from '../api/update-service-provider-body.params';
import { LogoOrLogoIdError } from './errors/logo-or-logo-id.error';
import { ServiceProvider } from './service-provider';
import { ServiceProviderKategorie } from './service-provider.enum';

describe('ServiceProvider', () => {
    describe('updateWithSafeFields', () => {
        it('should update only safe fields', () => {
            const serviceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true, {
                kategorie: ServiceProviderKategorie.HINWEISE,
                logo: undefined,
            });
            const update: UpdateServiceProviderBodyParams = {
                name: faker.company.buzzNoun(),
                url: faker.internet.url(),
                kategorie: serviceProvider.kategorie,
                logoId: faker.number.int({ min: 1, max: 1000 }),
            };
            const result: Option<LogoOrLogoIdError> = serviceProvider.updateWithSafeFields(update);
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
                logoId: 123,
            });
            const update: UpdateServiceProviderBodyParams = {
                logoId: null,
            };
            const result: Option<LogoOrLogoIdError> = serviceProvider.updateWithSafeFields(update);
            expect(result).toBeUndefined();
            expect(serviceProvider).toEqual({
                ...serviceProvider,
                logoId: undefined,
            });
        });

        it('should return an error if logoId is provided when logo is already set', () => {
            const serviceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true, {
                kategorie: ServiceProviderKategorie.HINWEISE,
            });
            const update: UpdateServiceProviderBodyParams = {
                logoId: 123,
            };
            const result: Option<LogoOrLogoIdError> = serviceProvider.updateWithSafeFields(update);
            expect(result).toBeInstanceOf(LogoOrLogoIdError);
            expect(serviceProvider.logoId).toBeUndefined();
        });
    });
});
