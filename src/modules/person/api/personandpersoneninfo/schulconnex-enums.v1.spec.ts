import { convertSPSHRollenartToSchulconnexRolle, SchulconnexRolle } from './schulconnex-enums.v1.js';
import { RollenArt } from '../../../rolle/domain/rolle.enums.js';

describe('convertRollenartToSchulconnexRolle', () => {
    it('should convert RollenArt.LERN to SchulconnexRolle.LERN', () => {
        expect(convertSPSHRollenartToSchulconnexRolle(RollenArt.LERN)).toBe(SchulconnexRolle.LERN);
    });

    it('should convert RollenArt.LEHR to SchulconnexRolle.LEHR', () => {
        expect(convertSPSHRollenartToSchulconnexRolle(RollenArt.LEHR)).toBe(SchulconnexRolle.LEHR);
    });

    it('should convert RollenArt.LEIT to SchulconnexRolle.LEIT', () => {
        expect(convertSPSHRollenartToSchulconnexRolle(RollenArt.LEIT)).toBe(SchulconnexRolle.LEIT);
    });

    it('should convert RollenArt.SYSADMIN to SchulconnexRolle.SYSADMIN', () => {
        expect(convertSPSHRollenartToSchulconnexRolle(RollenArt.SYSADMIN)).toBe(SchulconnexRolle.SYSADMIN);
    });

    it('should convert RollenArt.ORGADMIN to SchulconnexRolle.ORGADMIN', () => {
        expect(convertSPSHRollenartToSchulconnexRolle(RollenArt.ORGADMIN)).toBe(SchulconnexRolle.ORGADMIN);
    });

    it('should convert RollenArt.EXTERN to SchulconnexRolle.EXTERN', () => {
        expect(convertSPSHRollenartToSchulconnexRolle(RollenArt.EXTERN)).toBe(SchulconnexRolle.EXTERN);
    });
});
