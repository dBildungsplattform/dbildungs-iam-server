import {
    convertSPSHRollenartToSchulconnexRolleV1,
    convertSPSHRollenartToSchulconnexRolleV2,
    SchulconnexRolle,
} from './schulconnex-enums.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';

describe('convertRollenartToSchulconnexRolleV1', () => {
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

    it('should convert RollenArt.SORGBER to SchulconnexRolle.EXTERN', () => {
        expect(convertSPSHRollenartToSchulconnexRolleV1(RollenArt.SORGBER)).toBe(SchulconnexRolle.EXTERN);
    });

    it('should convert RollenArt.SCHB to SchulconnexRolle.LEHR', () => {
        expect(convertSPSHRollenartToSchulconnexRolleV1(RollenArt.SCHB)).toBe(SchulconnexRolle.LEHR);
    });

    it('should convert RollenArt.NLEHR to SchulconnexRolle.LEHR', () => {
        expect(convertSPSHRollenartToSchulconnexRolleV1(RollenArt.NLEHR)).toBe(SchulconnexRolle.LEHR);
    });
});

describe('convertSPSHRollenartToSchulconnexRolleV2', () => {
    it('should convert RollenArt.LERN to SchulconnexRolle.LERN', () => {
        expect(convertSPSHRollenartToSchulconnexRolleV2(RollenArt.LERN)).toBe(SchulconnexRolle.LERN);
    });

    it('should convert RollenArt.LEHR to SchulconnexRolle.LEHR', () => {
        expect(convertSPSHRollenartToSchulconnexRolleV2(RollenArt.LEHR)).toBe(SchulconnexRolle.LEHR);
    });

    it('should convert RollenArt.LEIT to SchulconnexRolle.LEIT', () => {
        expect(convertSPSHRollenartToSchulconnexRolleV2(RollenArt.LEIT)).toBe(SchulconnexRolle.LEIT);
    });

    it('should convert RollenArt.SYSADMIN to SchulconnexRolle.SYSADMIN', () => {
        expect(convertSPSHRollenartToSchulconnexRolleV2(RollenArt.SYSADMIN)).toBe(SchulconnexRolle.SYSADMIN);
    });

    it('should convert RollenArt.ORGADMIN to SchulconnexRolle.ORGADMIN', () => {
        expect(convertSPSHRollenartToSchulconnexRolleV2(RollenArt.ORGADMIN)).toBe(SchulconnexRolle.ORGADMIN);
    });

    it('should convert RollenArt.EXTERN to SchulconnexRolle.EXTERN', () => {
        expect(convertSPSHRollenartToSchulconnexRolleV2(RollenArt.EXTERN)).toBe(SchulconnexRolle.EXTERN);
    });

    it('should convert RollenArt.SORGBER to SchulconnexRolle.SORGBER', () => {
        expect(convertSPSHRollenartToSchulconnexRolleV2(RollenArt.SORGBER)).toBe(SchulconnexRolle.SORGBER);
    });

    it('should convert RollenArt.SCHB to SchulconnexRolle.SCHB', () => {
        expect(convertSPSHRollenartToSchulconnexRolleV2(RollenArt.SCHB)).toBe(SchulconnexRolle.SCHB);
    });

    it('should convert RollenArt.NLEHR to SchulconnexRolle.NLEHR', () => {
        expect(convertSPSHRollenartToSchulconnexRolleV2(RollenArt.NLEHR)).toBe(SchulconnexRolle.NLEHR);
    });
});
