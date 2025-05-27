import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { LernHatKlasse } from './lern-hat-klasse.js';

describe('LernHatKlasse specification', () => {
    const organisationRepoMock: DeepMocked<OrganisationRepository> = createMock();
    const rolleRepoMock: DeepMocked<RolleRepo> = createMock();
    const sut: LernHatKlasse = new LernHatKlasse(organisationRepoMock, rolleRepoMock);

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should return true, if spec does not apply', async () => {
        const rolle: Rolle<true> = DoFactory.createRolle(true, { rollenart: RollenArt.LEHR });
        const pks: Array<Personenkontext<true>> = [DoFactory.createPersonenkontext(true, { rolleId: rolle.id })];
        rolleRepoMock.findByIds.mockResolvedValueOnce(new Map([[rolle.id, rolle]]));
        expect(await sut.isSatisfiedBy(pks)).toBe(true);
    });

    it('should return true, if lern rolle has at least one klasse', async () => {
        const rolle: Rolle<true> = DoFactory.createRolle(true, { rollenart: RollenArt.LERN });
        const schule: Organisation<true> = DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE });
        const klasse: Organisation<true> = DoFactory.createOrganisation(true, {
            typ: OrganisationsTyp.KLASSE,
            administriertVon: schule.id,
        });
        const pks: Array<Personenkontext<true>> = [DoFactory.createPersonenkontext(true, { rolleId: rolle.id })];
        rolleRepoMock.findByIds.mockResolvedValueOnce(new Map([[rolle.id, rolle]]));
        organisationRepoMock.findByIds.mockResolvedValueOnce(
            new Map([
                [schule.id, schule],
                [klasse.id, klasse],
            ]),
        );
        expect(await sut.isSatisfiedBy(pks)).toBe(true);
    });

    it('should return false, if lern rolle has no klasse', async () => {
        const rolle: Rolle<true> = DoFactory.createRolle(true, { rollenart: RollenArt.LERN });
        const schule: Organisation<true> = DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE });
        const pks: Array<Personenkontext<true>> = [DoFactory.createPersonenkontext(true, { rolleId: rolle.id })];
        rolleRepoMock.findByIds.mockResolvedValueOnce(new Map([[rolle.id, rolle]]));
        organisationRepoMock.findByIds.mockResolvedValueOnce(new Map([[schule.id, schule]]));
        expect(await sut.isSatisfiedBy(pks)).toBe(false);
    });
});
