import { DoFactory } from '../../../../test/utils';
import { createMock, DeepMocked } from '../../../../test/utils/createMock';
import { ServiceProvider } from '../domain/service-provider';
import { ServiceProviderInternalRepo } from '../repo/service-provider.internal.repo';
import { NameUniqueAtOrgaSpecification } from './name-unique-at-orga.specification';

describe('NameUniqueAtOrgaSpecification', () => {
    const spRepoMock: DeepMocked<ServiceProviderInternalRepo> = createMock(ServiceProviderInternalRepo);
    const sut: NameUniqueAtOrgaSpecification = new NameUniqueAtOrgaSpecification(spRepoMock);

    const sp: ServiceProvider<boolean> = DoFactory.createServiceProvider(true);

    describe('isSatisfiedBy', () => {
        it('should return true, if the name is unique', async () => {
            spRepoMock.existsDuplicateNameForOrganisation.mockResolvedValueOnce(false);

            await expect(sut.isSatisfiedBy(sp)).resolves.toBe(true);
        });

        it('should return false, if the name is alread in use', async () => {
            spRepoMock.existsDuplicateNameForOrganisation.mockResolvedValueOnce(true);

            await expect(sut.isSatisfiedBy(sp)).resolves.toBe(false);
        });
    });
});
