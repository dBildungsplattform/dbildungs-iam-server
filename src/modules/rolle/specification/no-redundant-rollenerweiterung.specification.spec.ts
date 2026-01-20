import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { Rolle } from '../domain/rolle.js';
import { Rollenerweiterung } from '../domain/rollenerweiterung.js';
import { NoRedundantRollenerweiterung } from './no-redundant-rollenerweiterung.specification.js';

describe('NoRedundantRollenerweiterung', () => {
    describe('isSatisfiedBy', () => {
        const serviceProviderId: string = faker.string.uuid();

        it.each([
            [true, 'does not have the sp assigned', DoFactory.createRolle(true)],
            [
                false,
                'already has the sp assigned',
                DoFactory.createRolle(true, {
                    serviceProviderIds: [serviceProviderId],
                }),
            ],
            [false, 'is undefined', undefined],
        ])(
            'should return %s if the rolle %s',
            async (expected: boolean, _label: string, rolle: Option<Rolle<boolean>>) => {
                const rollenerweiterungMock: DeepMocked<Rollenerweiterung<boolean>> = createMock<
                    Rollenerweiterung<boolean>
                >({
                    serviceProviderId: serviceProviderId,
                });
                rollenerweiterungMock.getRolle.mockResolvedValue(rolle);

                const specification: NoRedundantRollenerweiterung = new NoRedundantRollenerweiterung();
                await expect(specification.isSatisfiedBy(rollenerweiterungMock)).resolves.toBe(expected);
            },
        );
    });
});
