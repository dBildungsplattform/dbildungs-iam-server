import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ServiceProviderKategorie,
    ServiceProviderMerkmal,
    ServiceProviderSystem,
    ServiceProviderTarget,
} from './service-provider.enum.js';
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
        describe('when construct is called on factory', () => {
            it('should return new instance', () => {
                const name: string = faker.string.alpha();
                const target: ServiceProviderTarget = faker.helpers.enumValue(ServiceProviderTarget);
                const url: string = faker.internet.url();
                const kategorie: ServiceProviderKategorie = faker.helpers.enumValue(ServiceProviderKategorie);
                const ssk: string = faker.string.uuid();
                const created: Date = faker.date.past();
                const updated: Date = faker.date.recent();
                const id: string = faker.string.uuid();
                const keycloakGroup: string = faker.string.alpha();
                const keycloakRole: string = faker.string.alpha();
                const externalSystem: ServiceProviderSystem = faker.helpers.enumValue(ServiceProviderSystem);
                const vidisAngebotId: string = faker.string.numeric();
                const merkmale: ServiceProviderMerkmal[] = [faker.helpers.enumValue(ServiceProviderMerkmal)];
                const example: ServiceProvider<true> = {
                    id: id,
                    createdAt: created,
                    updatedAt: updated,
                    name: name,
                    target: target,
                    url: url,
                    kategorie: kategorie,
                    providedOnSchulstrukturknoten: ssk,
                    logo: undefined,
                    logoMimeType: undefined,
                    keycloakGroup: keycloakGroup,
                    keycloakRole: keycloakRole,
                    externalSystem: externalSystem,
                    requires2fa: false,
                    vidisAngebotId: vidisAngebotId,
                    merkmale,
                };
                const serviceProvider: ServiceProvider<true> = sut.construct(
                    id,
                    created,
                    updated,
                    name,
                    target,
                    url,
                    kategorie,
                    ssk,
                    undefined,
                    undefined,
                    keycloakGroup,
                    keycloakRole,
                    externalSystem,
                    false,
                    vidisAngebotId,
                    merkmale,
                );

                expect(serviceProvider).toEqual(example);
            });
        });
    });
});
