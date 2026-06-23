import {
    convertSPSHRollenartForBackwardsCampatibilityV1,
    convertSPSHRollenartToSchulconnexRolle,
    SchulconnexRolle,
} from './schulconnex-enums.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';

describe('convertRollenartForBackwardsCampatibility', () => {
    it('should convert RollenArt.LERN to RollenArt.LERN', () => {
        expect(convertSPSHRollenartForBackwardsCampatibilityV1(RollenArt.LERN)).toBe(RollenArt.LERN);
    });

    it('should convert RollenArt.LEHR to RollenArt.LEHR', () => {
        expect(convertSPSHRollenartForBackwardsCampatibilityV1(RollenArt.LEHR)).toBe(RollenArt.LEHR);
    });

    it('should convert RollenArt.LEIT to RollenArt.LEIT', () => {
        expect(convertSPSHRollenartForBackwardsCampatibilityV1(RollenArt.LEIT)).toBe(RollenArt.LEIT);
    });

    it('should convert RollenArt.SYSADMIN to RollenArt.SYSADMIN', () => {
        expect(convertSPSHRollenartForBackwardsCampatibilityV1(RollenArt.SYSADMIN)).toBe(RollenArt.SYSADMIN);
    });

    it('should convert RollenArt.ORGADMIN to RollenArt.ORGADMIN', () => {
        expect(convertSPSHRollenartForBackwardsCampatibilityV1(RollenArt.ORGADMIN)).toBe(RollenArt.ORGADMIN);
    });

    it('should convert RollenArt.EXTERN to RollenArt.EXTERN', () => {
        expect(convertSPSHRollenartForBackwardsCampatibilityV1(RollenArt.EXTERN)).toBe(RollenArt.EXTERN);
    });

    it('should convert RollenArt.SORGBER to RollenArt.EXTERN', () => {
        expect(convertSPSHRollenartForBackwardsCampatibilityV1(RollenArt.SORGBER)).toBe(RollenArt.EXTERN);
    });

    it('should convert RollenArt.SCHB to RollenArt.LEHR', () => {
        expect(convertSPSHRollenartForBackwardsCampatibilityV1(RollenArt.SCHB)).toBe(RollenArt.LEHR);
    });

    it('should convert RollenArt.NLEHR to RollenArt.LEHR', () => {
        expect(convertSPSHRollenartForBackwardsCampatibilityV1(RollenArt.NLEHR)).toBe(RollenArt.LEHR);
    });
});

describe('convertSPSHRollenartToSchulconnexRolle', () => {
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

    it('should convert RollenArt.SORGBER to SchulconnexRolle.SORGBER', () => {
        expect(convertSPSHRollenartToSchulconnexRolle(RollenArt.SORGBER)).toBe(SchulconnexRolle.SORGBER);
    });

    it('should convert RollenArt.SCHB to SchulconnexRolle.SCHB', () => {
        expect(convertSPSHRollenartToSchulconnexRolle(RollenArt.SCHB)).toBe(SchulconnexRolle.SCHB);
    });

    it('should convert RollenArt.NLEHR to SchulconnexRolle.NLEHR', () => {
        expect(convertSPSHRollenartToSchulconnexRolle(RollenArt.NLEHR)).toBe(SchulconnexRolle.NLEHR);
    });
});
