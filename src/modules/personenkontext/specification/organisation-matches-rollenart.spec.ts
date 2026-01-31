import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { OrganisationMatchesRollenart } from './organisation-matches-rollenart.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';

describe('OrganisationMatchesRollenart specification', () => {
    const sut: OrganisationMatchesRollenart = new OrganisationMatchesRollenart();

    describe('when rollenart is SYSADMIN', () => {
        it('should return true, if organisation is LAND', () => {
            const orgaMock: DeepMocked<Organisation<true>> = createMock(Organisation<true>);
            orgaMock.typ = OrganisationsTyp.LAND;
            const rolleMock: DeepMocked<Rolle<true>> = createMock(Rolle<true>);
            rolleMock.rollenart = RollenArt.SYSADMIN;

            expect(sut.isSatisfiedBy(orgaMock, rolleMock)).toBeTruthy();
        });

        it('should return true, if organisation is ROOT', () => {
            const orgaMock: DeepMocked<Organisation<true>> = createMock(Organisation<true>);
            orgaMock.typ = OrganisationsTyp.ROOT;
            const rolleMock: DeepMocked<Rolle<true>> = createMock(Rolle<true>);
            rolleMock.rollenart = RollenArt.SYSADMIN;

            expect(sut.isSatisfiedBy(orgaMock, rolleMock)).toBeTruthy();
        });
    });

    describe('when rollenart is LEIT', () => {
        it('should return true, if organisation is SCHULE', () => {
            const orgaMock: DeepMocked<Organisation<true>> = createMock(Organisation<true>);
            orgaMock.typ = OrganisationsTyp.SCHULE;
            const rolleMock: DeepMocked<Rolle<true>> = createMock(Rolle<true>);
            rolleMock.rollenart = RollenArt.LEIT;

            expect(sut.isSatisfiedBy(orgaMock, rolleMock)).toBeTruthy();
        });

        it('should return false, if organisation is NOT SCHULE', () => {
            const orgaMock: DeepMocked<Organisation<true>> = createMock(Organisation<true>);
            orgaMock.typ = OrganisationsTyp.ROOT;
            const rolleMock: DeepMocked<Rolle<true>> = createMock(Rolle<true>);
            rolleMock.rollenart = RollenArt.LEIT;

            expect(sut.isSatisfiedBy(orgaMock, rolleMock)).toBeFalsy();
        });
    });

    describe('when rollenart is LERN', () => {
        it('should return true, if organisation is SCHULE', () => {
            const orgaMock: DeepMocked<Organisation<true>> = createMock(Organisation<true>);
            orgaMock.typ = OrganisationsTyp.SCHULE;
            const rolleMock: DeepMocked<Rolle<true>> = createMock(Rolle<true>);
            rolleMock.rollenart = RollenArt.LERN;

            expect(sut.isSatisfiedBy(orgaMock, rolleMock)).toBeTruthy();
        });

        it('should return true, if organisation is KLASSE', () => {
            const orgaMock: DeepMocked<Organisation<true>> = createMock(Organisation<true>);
            orgaMock.typ = OrganisationsTyp.KLASSE;
            const rolleMock: DeepMocked<Rolle<true>> = createMock(Rolle<true>);
            rolleMock.rollenart = RollenArt.LERN;

            expect(sut.isSatisfiedBy(orgaMock, rolleMock)).toBeTruthy();
        });
    });

    describe('when rollenart is LEHR', () => {
        it('should return true, if organisation is SCHULE', () => {
            const orgaMock: DeepMocked<Organisation<true>> = createMock(Organisation<true>);
            orgaMock.typ = OrganisationsTyp.SCHULE;
            const rolleMock: DeepMocked<Rolle<true>> = createMock(Rolle<true>);
            rolleMock.rollenart = RollenArt.LEHR;

            expect(sut.isSatisfiedBy(orgaMock, rolleMock)).toBeTruthy();
        });

        it('should return false, if organisation is KLASSE', () => {
            const orgaMock: DeepMocked<Organisation<true>> = createMock(Organisation<true>);
            orgaMock.typ = OrganisationsTyp.KLASSE;
            const rolleMock: DeepMocked<Rolle<true>> = createMock(Rolle<true>);
            rolleMock.rollenart = RollenArt.LEHR;

            expect(sut.isSatisfiedBy(orgaMock, rolleMock)).toBeFalsy();
        });
    });
});
