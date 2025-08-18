import { Test, TestingModule } from '@nestjs/testing';

import { faker } from '@faker-js/faker';
import { RollenMappingFactory } from './rollenmapping.factory.js';
import { RollenMapping } from './rollenmapping.js';

describe('RollenMappingFactory', () => {
    let module: TestingModule;
    let sut: RollenMappingFactory;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [RollenMappingFactory],
        }).compile();

        sut = module.get(RollenMappingFactory);
    });

    afterAll(async () => {
        await module.close();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('construct', () => {
        describe('when constructing', () => {
            it('should return RollenMapping', () => {
                const id: string = faker.string.uuid();
                const createdAt: Date = faker.date.past();
                const updatedAt: Date = faker.date.recent();
                const rolleId: string = faker.string.uuid();
                const serviceProviderId: string = faker.string.uuid();
                const mapToLmsRolle: string = faker.string.alphanumeric();

                const rollenMapping: RollenMapping<true> = sut.construct(
                    id,
                    createdAt,
                    updatedAt,
                    rolleId,
                    serviceProviderId,
                    mapToLmsRolle,
                );

                expect(rollenMapping.id).toStrictEqual(id);
                expect(rollenMapping.createdAt).toStrictEqual(createdAt);
                expect(rollenMapping.updatedAt).toStrictEqual(updatedAt);
                expect(rollenMapping.rolleId).toStrictEqual(rolleId);
                expect(rollenMapping.serviceProviderId).toStrictEqual(serviceProviderId);
                expect(rollenMapping.mapToLmsRolle).toStrictEqual(mapToLmsRolle);
            });
        });
    });

    describe('createNew', () => {
        describe('when creating a new RollenMapping', () => {
            it('should return RollenMapping', () => {
                const rolleId: string = faker.string.uuid();
                const serviceProviderId: string = faker.string.uuid();
                const mapToLmsRolle: string = faker.string.alphanumeric();

                const rollenMapping: RollenMapping<false> = sut.createNew(rolleId, serviceProviderId, mapToLmsRolle);

                expect(rollenMapping.id).toBeUndefined();
                expect(rollenMapping.createdAt).toBeUndefined();
                expect(rollenMapping.updatedAt).toBeUndefined();
                expect(rollenMapping.rolleId).toStrictEqual(rolleId);
                expect(rollenMapping.serviceProviderId).toStrictEqual(serviceProviderId);
                expect(rollenMapping.mapToLmsRolle).toStrictEqual(mapToLmsRolle);
            });
        });
    });

    describe('update', () => {
        describe('when updating', () => {
            it('should return RollenMapping', () => {
                const id: string = faker.string.uuid();
                const createdAt: Date = faker.date.past();
                const updatedAt: Date = faker.date.recent();
                const rolleId: string = faker.string.uuid();
                const serviceProviderId: string = faker.string.uuid();
                const mapToLmsRolle: string = faker.string.alphanumeric();

                const rollenMapping: RollenMapping<true> = sut.update(
                    id,
                    createdAt,
                    updatedAt,
                    rolleId,
                    serviceProviderId,
                    mapToLmsRolle,
                );

                expect(rollenMapping.id).toStrictEqual(id);
                expect(rollenMapping.createdAt).toStrictEqual(createdAt);
                expect(rollenMapping.updatedAt).toStrictEqual(updatedAt);
                expect(rollenMapping.rolleId).toStrictEqual(rolleId);
                expect(rollenMapping.serviceProviderId).toStrictEqual(serviceProviderId);
                expect(rollenMapping.mapToLmsRolle).toStrictEqual(mapToLmsRolle);
            });
        });
    });
});
