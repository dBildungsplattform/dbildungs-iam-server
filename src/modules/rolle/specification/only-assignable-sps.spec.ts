import { DoFactory } from '../../../../test/utils/do-factory.js';
import { ServiceProviderMerkmal } from '../../service-provider/domain/service-provider.enum.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { Rolle } from '../domain/rolle.js';
import { NurNachtraeglichZuweisbareServiceProvider } from './only-assignable-sps.js';

function getUnassignableServiceProviders(n: number): ServiceProvider<true>[] {
    const result: ServiceProvider<true>[] = [];
    for (let i: number = 0; i < n; i++) {
        result.push(
            DoFactory.createServiceProvider(true, {
                merkmale: [],
            }),
        );
    }
    return result;
}

function getAssignableServiceProviders(n: number): ServiceProvider<true>[] {
    return getUnassignableServiceProviders(n).map((sp: ServiceProvider<true>) => {
        return {
            ...sp,
            merkmale: [ServiceProviderMerkmal.NACHTRAEGLICH_ZUWEISBAR],
        };
    });
}

function buildRolleWithServiceProviders(
    sps: ServiceProvider<true>[],
    baseRolle?: Partial<Rolle<true>> | undefined,
): Rolle<true> {
    return DoFactory.createRolle(true, {
        ...baseRolle,
        serviceProviderIds: sps.map((sp: ServiceProvider<true>) => sp.id),
        serviceProviderData: sps,
    });
}

type TestData = {
    oldRolle: Rolle<true>;
    updatedRolle: Rolle<true>;
    isValid: boolean;
};

describe('OnlyAssignableServiceProviders', () => {
    describe('when sps have not changed', () => {
        describe.each([
            { sps: getAssignableServiceProviders(0) },
            { sps: getAssignableServiceProviders(1) },
            { sps: getAssignableServiceProviders(3) },
        ])('when rolle has $sps.length service providers', ({ sps }: { sps: ServiceProvider<true>[] }) => {
            it('should return true', async () => {
                const oldRolle: Rolle<true> = buildRolleWithServiceProviders(sps);
                const updatedRolle: Rolle<false> = DoFactory.createRolle(false, oldRolle);

                const spec: NurNachtraeglichZuweisbareServiceProvider = new NurNachtraeglichZuweisbareServiceProvider(oldRolle);
                await expect(spec.isSatisfiedBy(updatedRolle)).resolves.toBe(true);
            });
        });
    });

    describe('when sps are added', () => {
        const baseRolle: Rolle<true> = buildRolleWithServiceProviders(
            getAssignableServiceProviders(3).concat(getUnassignableServiceProviders(2)),
        );
        describe.each([[true], [false]])('and the added sps are assignable:%s', (areAssignable: boolean) => {
            const getServiceProviders: (n: number) => ServiceProvider<true>[] = areAssignable
                ? getAssignableServiceProviders
                : getUnassignableServiceProviders;
            it.each([
                {
                    oldRolle: baseRolle,
                    updatedRolle: buildRolleWithServiceProviders(
                        baseRolle.serviceProviderData.concat(getServiceProviders(1)),
                        baseRolle,
                    ),
                    isValid: areAssignable,
                },
                {
                    oldRolle: baseRolle,
                    updatedRolle: buildRolleWithServiceProviders(
                        baseRolle.serviceProviderData.concat(getServiceProviders(5)),
                        baseRolle,
                    ),
                    isValid: areAssignable,
                },
            ])(
                'should return $isValid if $oldRolle.serviceProviderData.length changes to $updatedRolle.serviceProviderData.length',
                async ({ oldRolle, updatedRolle, isValid }: TestData) => {
                    const spec: NurNachtraeglichZuweisbareServiceProvider = new NurNachtraeglichZuweisbareServiceProvider(oldRolle);
                    await expect(spec.isSatisfiedBy(updatedRolle)).resolves.toBe(isValid);
                },
            );
        });
    });
    describe('when sps are removed', () => {
        const baseRolle: Rolle<true> = buildRolleWithServiceProviders(
            getAssignableServiceProviders(3).concat(getUnassignableServiceProviders(2)),
        );
        describe.each([[true], [false]])('and the removed sps are assignable:%s', (areAssignable: boolean) => {
            it.each([
                {
                    oldRolle: baseRolle,
                    updatedRolle: buildRolleWithServiceProviders(
                        baseRolle.serviceProviderData.filter((sp: ServiceProvider<true>) =>
                            areAssignable
                                ? !sp.merkmale.includes(ServiceProviderMerkmal.NACHTRAEGLICH_ZUWEISBAR)
                                : sp.merkmale.includes(ServiceProviderMerkmal.NACHTRAEGLICH_ZUWEISBAR),
                        ),
                        baseRolle,
                    ),
                    isValid: areAssignable,
                },
                {
                    oldRolle: buildRolleWithServiceProviders(
                        areAssignable ? getAssignableServiceProviders(3) : getUnassignableServiceProviders(3),
                        baseRolle,
                    ),
                    updatedRolle: buildRolleWithServiceProviders([], baseRolle),
                    isValid: areAssignable,
                },
            ])(
                'should return $isValid if $oldRolle.serviceProviderData.length changes to $updatedRolle.serviceProviderData.length',
                async ({ oldRolle, updatedRolle, isValid }: TestData) => {
                    const spec: NurNachtraeglichZuweisbareServiceProvider = new NurNachtraeglichZuweisbareServiceProvider(oldRolle);
                    await expect(spec.isSatisfiedBy(updatedRolle)).resolves.toBe(isValid);
                },
            );
        });
    });

    describe('when sps are added and removed', () => {
        const baseRolle: Rolle<true> = buildRolleWithServiceProviders(getAssignableServiceProviders(5));
        it.each([
            {
                oldRolle: baseRolle,
                updatedRolle: buildRolleWithServiceProviders(
                    baseRolle.serviceProviderData
                        .filter(
                            (sp: ServiceProvider<true>) =>
                                !sp.merkmale.includes(ServiceProviderMerkmal.NACHTRAEGLICH_ZUWEISBAR),
                        )
                        .concat(getAssignableServiceProviders(3)),
                    baseRolle,
                ),
                isValid: true,
            },
            {
                oldRolle: baseRolle,
                updatedRolle: buildRolleWithServiceProviders(
                    baseRolle.serviceProviderData
                        .filter((sp: ServiceProvider<true>) =>
                            sp.merkmale.includes(ServiceProviderMerkmal.NACHTRAEGLICH_ZUWEISBAR),
                        )
                        .concat(getUnassignableServiceProviders(3)),
                    baseRolle,
                ),
                isValid: false,
            },
        ])('should return $isValid', async ({ oldRolle, updatedRolle, isValid }: TestData) => {
            const spec: NurNachtraeglichZuweisbareServiceProvider = new NurNachtraeglichZuweisbareServiceProvider(oldRolle);
            await expect(spec.isSatisfiedBy(updatedRolle)).resolves.toBe(isValid);
        });
    });
});
