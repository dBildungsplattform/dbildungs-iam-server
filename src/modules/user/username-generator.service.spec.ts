import { Test, TestingModule } from '@nestjs/testing';
import { UserModule } from './user.module.js';
import { UsernameGeneratorService } from './username-generator.service.js';

describe('The UsernameGenerator Service', () => {
    let module: TestingModule;
    let service: UsernameGeneratorService;

    beforeAll(async () => {
        module = await Test.createTestingModule({ imports: [UserModule] }).compile();
        service = await module.get(UsernameGeneratorService);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should give an all lowercase username', () => {
        expect(service.generateUsername('Torsten', 'Rottelburg')).toBe('trottelburg');
    });

    it('should give an Error when the fist name is empty', () => {
        expect(service.generateUsername('', 'Rottelburg')).toStrictEqual(new Error('First name not given'));
    });

    it('should give an Error when the last name is empty', () => {
        expect(service.generateUsername('Torsten', '')).toStrictEqual(new Error('Last name not given'));
    });

    it('should normalize German special characters', () => {
        expect(service.generateUsername('Öre', 'Füßenwärk')).toBe('ofuessenwaerk');
    });

    it('should remove diacritics', () => {
        expect(service.generateUsername('Èlène', 'Lunâtiz')).toBe('elunatiz');
    });

    it('should remove punctuation', () => {
        expect(service.generateUsername('Èlène', 'L.,?unâtiz')).toBe('elunatiz');
    });

    it('should remove numbers from the names given', () => {
        expect(service.generateUsername('Èlène', 'L.,?un344âtiz')).toBe('elunatiz');
    });

    it('should non diacritical special chars', () => {
        expect(service.generateUsername('Ebru', 'Altınova')).toBe('ealtnova');
        expect(service.generateUsername('Øre', 'Olsen')).toBe('oolsen');
    });
});
