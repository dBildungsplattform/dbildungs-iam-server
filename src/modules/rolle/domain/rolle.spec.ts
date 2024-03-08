import { DoFactory } from '../../../../test/utils/index.js';
import { RollenMerkmal, RollenSystemRecht } from './rolle.enums.js';
import { Rolle } from './rolle.js';

describe('Rolle Aggregate', () => {
    describe('addMerkmal', () => {
        it('should add merkmal if it does not exist', () => {
            const savedRolle: Rolle<true> = DoFactory.createRolle(true, { merkmale: [] });
            savedRolle.addMerkmal(RollenMerkmal.BEFRISTUNG_PFLICHT);

            expect(savedRolle.merkmale).toEqual([RollenMerkmal.BEFRISTUNG_PFLICHT]);
        });

        it('should not add merkmal if it already exists', () => {
            const savedRolle: Rolle<true> = DoFactory.createRolle(true, {
                merkmale: [RollenMerkmal.BEFRISTUNG_PFLICHT],
            });
            savedRolle.addMerkmal(RollenMerkmal.BEFRISTUNG_PFLICHT);

            expect(savedRolle.merkmale).toEqual([RollenMerkmal.BEFRISTUNG_PFLICHT]);
        });
    });

    describe('removeMerkmal', () => {
        it('should remove merkmal if it exists', () => {
            const savedRolle: Rolle<true> = DoFactory.createRolle(true, {
                merkmale: [RollenMerkmal.BEFRISTUNG_PFLICHT, RollenMerkmal.KOPERS_PFLICHT],
            });
            savedRolle.removeMerkmal(RollenMerkmal.BEFRISTUNG_PFLICHT);

            expect(savedRolle.merkmale).toEqual([RollenMerkmal.KOPERS_PFLICHT]);
        });

        it('should do nothing if merkmal does not exist', () => {
            const savedRolle: Rolle<true> = DoFactory.createRolle(true, {
                merkmale: [RollenMerkmal.BEFRISTUNG_PFLICHT],
            });
            savedRolle.removeMerkmal(RollenMerkmal.KOPERS_PFLICHT);

            expect(savedRolle.merkmale).toEqual([RollenMerkmal.BEFRISTUNG_PFLICHT]);
        });
    });

    describe('addSystemRecht', () => {
        it('should add systemRecht if it does not exist', () => {
            const savedRolle: Rolle<true> = DoFactory.createRolle(true, { systemrechte: [] });
            savedRolle.addSystemRecht(RollenSystemRecht.ROLLEN_VERWALTEN);

            expect(savedRolle.systemrechte).toEqual([RollenSystemRecht.ROLLEN_VERWALTEN]);
        });

        it('should not add systemRecht if it already exists', () => {
            const savedRolle: Rolle<true> = DoFactory.createRolle(true, {
                systemrechte: [RollenSystemRecht.ROLLEN_VERWALTEN],
            });
            savedRolle.addSystemRecht(RollenSystemRecht.ROLLEN_VERWALTEN);

            expect(savedRolle.systemrechte).toEqual([RollenSystemRecht.ROLLEN_VERWALTEN]);
        });
    });

    describe('hasSystemRecht', () => {
        it('should have systemRecht', () => {
            const savedRolle: Rolle<true> = DoFactory.createRolle(true, { systemrechte: [] });
            savedRolle.addSystemRecht(RollenSystemRecht.ROLLEN_VERWALTEN);

            expect(savedRolle.hasSystemRecht(RollenSystemRecht.ROLLEN_VERWALTEN)).toBeTruthy();
        });

        it('should not have systemRecht', () => {
            const savedRolle: Rolle<true> = DoFactory.createRolle(true, { systemrechte: [] });

            expect(savedRolle.hasSystemRecht(RollenSystemRecht.ROLLEN_VERWALTEN)).toBeFalsy();
        });
    });
});
