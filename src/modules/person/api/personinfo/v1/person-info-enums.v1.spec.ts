import { convertRollenartToPersonInfoKontextV1Rolle, PersonInfoKontextV1Rolle } from './person-info-enums.v1';
import { RollenArt } from '../../../../rolle/domain/rolle.enums';

describe('convertRollenartToPersonInfoKontextV1Rolle', () => {
    it('should convert RollenArt.LERN to PersonInfoKontextV1Rolle.LERN', () => {
        expect(convertRollenartToPersonInfoKontextV1Rolle(RollenArt.LERN)).toBe(PersonInfoKontextV1Rolle.LERN);
    });

    it('should convert RollenArt.LEHR to PersonInfoKontextV1Rolle.LEHR', () => {
        expect(convertRollenartToPersonInfoKontextV1Rolle(RollenArt.LEHR)).toBe(PersonInfoKontextV1Rolle.LEHR);
    });

    it('should convert RollenArt.LEIT to PersonInfoKontextV1Rolle.LEIT', () => {
        expect(convertRollenartToPersonInfoKontextV1Rolle(RollenArt.LEIT)).toBe(PersonInfoKontextV1Rolle.LEIT);
    });

    it('should convert RollenArt.SYSADMIN to PersonInfoKontextV1Rolle.SYSADMIN', () => {
        expect(convertRollenartToPersonInfoKontextV1Rolle(RollenArt.SYSADMIN)).toBe(PersonInfoKontextV1Rolle.SYSADMIN);
    });

    it('should convert RollenArt.ORGADMIN to PersonInfoKontextV1Rolle.ORGADMIN', () => {
        expect(convertRollenartToPersonInfoKontextV1Rolle(RollenArt.ORGADMIN)).toBe(PersonInfoKontextV1Rolle.ORGADMIN);
    });

    it('should convert RollenArt.EXTERN to PersonInfoKontextV1Rolle.EXTERN', () => {
        expect(convertRollenartToPersonInfoKontextV1Rolle(RollenArt.EXTERN)).toBe(PersonInfoKontextV1Rolle.EXTERN);
    });
});
