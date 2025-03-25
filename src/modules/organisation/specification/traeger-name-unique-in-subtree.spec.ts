import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DoFactory } from '../../../../test/utils/index.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';
import { Organisation } from '../domain/organisation.js';
import { OrganisationRepository } from '../persistence/organisation.repository.js';
import { TraegerNameUniqueInSubtree } from './traeger-name-unique-in-subtree.js';
import { faker } from '@faker-js/faker';

type SubtreeType = 'oeffentlich' | 'ersatz';

describe('TraegerNameUniqueInSubtree Specification', () => {
    let sut: TraegerNameUniqueInSubtree<true>;
    let orgaRepoMock: DeepMocked<OrganisationRepository>;
    beforeEach(() => {
        orgaRepoMock = createMock<OrganisationRepository>();
        sut = new TraegerNameUniqueInSubtree(orgaRepoMock);
    });

    it('when object is not of type traeger, it should return true', async () => {
        const nonTraeger: Organisation<true> = DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE });
        await expect(sut.isSatisfiedBy(nonTraeger)).resolves.toBe(true);
    });

    it('when no traeger with same name exists, it should return true', async () => {
        const traeger: Organisation<true> = DoFactory.createOrganisation(true, { typ: OrganisationsTyp.TRAEGER });
        orgaRepoMock.findBy.mockResolvedValueOnce([[], 0]);
        await expect(sut.isSatisfiedBy(traeger)).resolves.toBe(true);
    });

    it('when only traeger itself has the name, it should return true', async () => {
        const traeger: Organisation<true> = DoFactory.createOrganisation(true, { typ: OrganisationsTyp.TRAEGER });
        orgaRepoMock.findBy.mockResolvedValueOnce([[traeger], 1]);
        await expect(sut.isSatisfiedBy(traeger)).resolves.toBe(true);
    });

    describe.each([['oeffentlich' as SubtreeType], ['ersatz' as SubtreeType]])(
        'when looking at %s subtree',
        (subtreeType: SubtreeType) => {
            let parent: Organisation<true>;
            beforeEach(() => {
                parent = DoFactory.createOrganisation(true, { typ: OrganisationsTyp.TRAEGER });
                if (subtreeType === 'oeffentlich') {
                    orgaRepoMock.findRootDirectChildren.mockResolvedValueOnce([parent, undefined]);
                } else {
                    orgaRepoMock.findRootDirectChildren.mockResolvedValueOnce([undefined, parent]);
                }
            });

            describe.each([['direct'], ['indirect']])('when traeger is %s child of subtreeRoot', (label: string) => {
                let traeger: Organisation<true>;
                beforeEach(() => {
                    traeger = DoFactory.createOrganisation(true, {
                        typ: OrganisationsTyp.TRAEGER,
                        zugehoerigZu: label === 'direct' ? parent.id : faker.string.uuid(),
                    });
                    if (label === 'indirect') orgaRepoMock.isOrgaAParentOfOrgaB.mockResolvedValueOnce(true);
                });

                it.each([
                    ['unique', true],
                    ['not unique', false],
                ])('when name is %s in subtree, it should return %s', async (_label: string, expected: boolean) => {
                    orgaRepoMock.findBy.mockResolvedValueOnce([
                        [
                            traeger,
                            DoFactory.createOrganisation(true, { name: traeger.name, typ: OrganisationsTyp.TRAEGER }),
                        ],
                        1,
                    ]);
                    orgaRepoMock.isOrgaAParentOfOrgaB.mockResolvedValueOnce(!expected);
                    await expect(sut.isSatisfiedBy(traeger)).resolves.toBe(expected);
                });
                it('when name is not unique in subtree, it should return false', async () => {
                    orgaRepoMock.findBy.mockResolvedValueOnce([
                        [
                            traeger,
                            DoFactory.createOrganisation(true, { name: traeger.name, typ: OrganisationsTyp.TRAEGER }),
                        ],
                        1,
                    ]);
                    orgaRepoMock.isOrgaAParentOfOrgaB.mockResolvedValueOnce(true);
                    await expect(sut.isSatisfiedBy(traeger)).resolves.toBe(false);
                });
            });
        },
    );
});
