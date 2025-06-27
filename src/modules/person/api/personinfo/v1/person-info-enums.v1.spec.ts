import { convertSPSHRollenartToSchulconnexRolle, SchulconnexRolle } from '../schulconnex-enums.v1.js';
import { RollenArt } from '../../../../rolle/domain/rolle.enums.js';

describe('convertRollenartToPersonInfoKontextV1Rolle', () => {
    it('should convert RollenArt.LERN to PersonInfoKontextV1Rolle.LERN', () => {
        expect(convertSPSHRollenartToSchulconnexRolle(RollenArt.LERN)).toBe(SchulconnexRolle.LERN);
    });

    it('should convert RollenArt.LEHR to PersonInfoKontextV1Rolle.LEHR', () => {
        expect(convertSPSHRollenartToSchulconnexRolle(RollenArt.LEHR)).toBe(SchulconnexRolle.LEHR);
    });

    it('should convert RollenArt.LEIT to PersonInfoKontextV1Rolle.LEIT', () => {
        expect(convertSPSHRollenartToSchulconnexRolle(RollenArt.LEIT)).toBe(SchulconnexRolle.LEIT);
    });

    it('should convert RollenArt.SYSADMIN to PersonInfoKontextV1Rolle.SYSADMIN', () => {
        expect(convertSPSHRollenartToSchulconnexRolle(RollenArt.SYSADMIN)).toBe(SchulconnexRolle.SYSADMIN);
    });

    it('should convert RollenArt.ORGADMIN to PersonInfoKontextV1Rolle.ORGADMIN', () => {
        expect(convertSPSHRollenartToSchulconnexRolle(RollenArt.ORGADMIN)).toBe(SchulconnexRolle.ORGADMIN);
    });

    it('should convert RollenArt.EXTERN to PersonInfoKontextV1Rolle.EXTERN', () => {
        expect(convertSPSHRollenartToSchulconnexRolle(RollenArt.EXTERN)).toBe(SchulconnexRolle.EXTERN);
    });
});
