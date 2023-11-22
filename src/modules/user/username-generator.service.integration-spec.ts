import { Test, TestingModule } from '@nestjs/testing';
import { UsernameGeneratorService } from './username-generator.service.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { FindUserFilter, KeycloakUserService, UserDo } from '../keycloak-administration/index.js';
import { UserRepository } from './user.repository.js';
import { EntityNotFoundError } from '../../shared/error/index.js';

describe('The UsernameGenerator Service', () => {
    let module: TestingModule;
    let service: UsernameGeneratorService;
    let kcUserService: DeepMocked<KeycloakUserService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                UsernameGeneratorService,
                UserRepository,
                { provide: KeycloakUserService, useValue: createMock<KeycloakUserService>() },
            ],
        }).compile();
        service = module.get(UsernameGeneratorService);
        kcUserService = module.get(KeycloakUserService);
    });

    afterAll(async () => {
        await module.close();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should give an all lowercase username', async () => {
        kcUserService.findOne.mockResolvedValueOnce({ ok: false, error: new EntityNotFoundError('None there') });
        await expect(service.generateUsername('Torsten', 'Rottelburg')).resolves.toBe('trottelburg');
    });

    it('should give an Error when the fist name is empty', async () => {
        await expect(service.generateUsername('', 'Rottelburg')).rejects.toStrictEqual(
            new Error('First name not given'),
        );
    });

    it('should give an Error when the last name is empty', async () => {
        await expect(service.generateUsername('Torsten', '')).rejects.toStrictEqual(new Error('Last name not given'));
    });

    it('should normalize German special characters', async () => {
        kcUserService.findOne.mockResolvedValueOnce({ ok: false, error: new EntityNotFoundError('None there') });
        await expect(service.generateUsername('Öre', 'Füßenwärk')).resolves.toBe('ofuessenwaerk');
    });

    it('should remove diacritics', async () => {
        kcUserService.findOne.mockResolvedValueOnce({ ok: false, error: new EntityNotFoundError('None there') });
        await expect(service.generateUsername('Èlène', 'Lunâtiz')).resolves.toBe('elunatiz');
    });

    it('should remove punctuation', async () => {
        kcUserService.findOne.mockResolvedValueOnce({ ok: false, error: new EntityNotFoundError('None there') });
        await expect(service.generateUsername('Èlène', 'L.,?unâtiz')).resolves.toBe('elunatiz');
    });

    it('should remove numbers from the names given', async () => {
        kcUserService.findOne.mockResolvedValueOnce({ ok: false, error: new EntityNotFoundError('None there') });
        await expect(service.generateUsername('Èlène', 'L.,?un344âtiz')).resolves.toBe('elunatiz');
    });

    it('should remove non diacritical special chars', async () => {
        kcUserService.findOne.mockResolvedValueOnce({ ok: false, error: new EntityNotFoundError('None there') });
        await expect(service.generateUsername('Ebru', 'Altınova')).resolves.toBe('ealtnova');
        kcUserService.findOne.mockResolvedValueOnce({ ok: false, error: new EntityNotFoundError('None there') });
        await expect(service.generateUsername('Øre', 'Olsen')).resolves.toBe('rolsen');
    });

    it('should add a number when username already exists', async () => {
        kcUserService.findOne
            .mockResolvedValueOnce({ ok: true, value: new UserDo<true>() })
            .mockResolvedValueOnce({ ok: false, error: new EntityNotFoundError('Not found') });
        const generatedUsername: string = await service.generateUsername('Max', 'Meyer');
        expect(generatedUsername).toBe('mmeyer1');
    });

    it('should increment the counter when a username would exist more than twice', async () => {
        kcUserService.findOne.mockImplementation((userFilter: FindUserFilter) => {
            if (userFilter.username == 'mmeyer' || userFilter.username == 'mmeyer1') {
                return Promise.resolve({ ok: true, value: new UserDo<true>() });
            } else return Promise.resolve({ ok: false, error: new EntityNotFoundError('Not found') });
        });
        const generatedUsername: string = await service.generateUsername('Max', 'Meyer');
        expect(generatedUsername).toBe('mmeyer2');
    });

    it("Should fill 'holes' in the counter if there are any", async () => {
        kcUserService.findOne
            .mockResolvedValueOnce({ ok: true, value: new UserDo<true>() })
            .mockResolvedValueOnce({ ok: true, value: new UserDo<true>() })
            .mockResolvedValueOnce({ ok: true, value: new UserDo<true>() })
            .mockResolvedValueOnce({ ok: false, error: new EntityNotFoundError('Not found') })
            .mockResolvedValueOnce({ ok: true, value: new UserDo<true>() });
        const generatedUsername: string = await service.generateUsername('Renate', 'Bergmann');
        expect(generatedUsername).toBe('rbergmann3');
    });
});
