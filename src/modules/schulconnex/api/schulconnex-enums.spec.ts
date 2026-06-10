import { convertSPSHRollenartToSchulconnexRolleV1, SchulconnexRolle } from './schulconnex-enums.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';

describe('convertRollenartToSchulconnexRolle', () => {
    it('should convert RollenArt.LERN to SchulconnexRolle.LERN', () => {
        expect(convertSPSHRollenartToSchulconnexRolleV1(RollenArt.LERN)).toBe(SchulconnexRolle.LERN);
    });

    it('should convert RollenArt.LEHR to SchulconnexRolle.LEHR', () => {
        expect(convertSPSHRollenartToSchulconnexRolleV1(RollenArt.LEHR)).toBe(SchulconnexRolle.LEHR);
    });

    it('should convert RollenArt.LEIT to SchulconnexRolle.LEIT', () => {
        expect(convertSPSHRollenartToSchulconnexRolleV1(RollenArt.LEIT)).toBe(SchulconnexRolle.LEIT);
    });

    it('should convert RollenArt.SYSADMIN to SchulconnexRolle.SYSADMIN', () => {
        expect(convertSPSHRollenartToSchulconnexRolleV1(RollenArt.SYSADMIN)).toBe(SchulconnexRolle.SYSADMIN);
    });

    it('should convert RollenArt.ORGADMIN to SchulconnexRolle.ORGADMIN', () => {
        expect(convertSPSHRollenartToSchulconnexRolleV1(RollenArt.ORGADMIN)).toBe(SchulconnexRolle.ORGADMIN);
    });

    it('should convert RollenArt.EXTERN to SchulconnexRolle.EXTERN', () => {
        expect(convertSPSHRollenartToSchulconnexRolleV1(RollenArt.EXTERN)).toBe(SchulconnexRolle.EXTERN);
    });
});
