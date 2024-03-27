import { Test, TestingModule } from '@nestjs/testing';
import { ServiceProviderFactory } from './service-provider.factory.js';
import { faker } from '@faker-js/faker';
import { ServiceProviderKategorie } from './service-provider.enum.js';
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
        describe('when construct is called on factory', () => {
            it('should return new instance', () => {
                const name: string = faker.string.alpha();
                const url: string = faker.internet.url();
                const kategorie: ServiceProviderKategorie = faker.helpers.enumValue(ServiceProviderKategorie);
                const ssk: string = faker.string.uuid();
                const created: Date = faker.date.past();
                const updated: Date = faker.date.recent();
                const id: string = faker.string.uuid();
                const example: ServiceProvider<true> = {
                    id: id,
                    createdAt: created,
                    updatedAt: updated,
                    name: name,
                    url: url,
                    kategorie: kategorie,
                    providedOnSchulstrukturknoten: ssk,
                    logo: undefined,
                    logoMimeType: undefined,
                };
                const serviceProvider: ServiceProvider<true> = sut.construct(
                    id,
                    created,
                    updated,
                    name,
                    url,
                    kategorie,
                    ssk,
                    undefined,
                    undefined,
                );

                expect(serviceProvider).toEqual(example);
            });
        });
    });
});
