import { Test, TestingModule } from '@nestjs/testing';
import { PrivacyIdeaAdministrationController } from './privacy-idea-administration.controller.js';
import { PrivacyIdeaAdministrationService } from './privacy-idea-administration.service.js';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { TokenStateResponse } from './token-state.response.js';
import { PrivacyIdeaToken } from './privacy-idea-api.types.js';
import { HttpModule } from '@nestjs/axios';

describe('PrivacyIdeaAdministrationController', () => {
    let module: TestingModule;
    let sut: PrivacyIdeaAdministrationController;
    let serviceMock: DeepMocked<PrivacyIdeaAdministrationService>;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [HttpModule],
            controllers: [PrivacyIdeaAdministrationController],
            providers: [
                {
                    provide: PrivacyIdeaAdministrationService,
                    useValue: createMock<PrivacyIdeaAdministrationService>(),
                },
            ],
        }).compile();

        sut = module.get<PrivacyIdeaAdministrationController>(PrivacyIdeaAdministrationController);
        serviceMock = module.get(PrivacyIdeaAdministrationService);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
        expect(serviceMock).toBeDefined();
    });

    describe('PrivacyIdeaAdministrationController initializeSoftwareToken', () => {
        let privacyIdeaAdministrationService: PrivacyIdeaAdministrationService;

        beforeEach(() => {
            privacyIdeaAdministrationService = module.get<PrivacyIdeaAdministrationService>(
                PrivacyIdeaAdministrationService,
            );
        });

        it('should successfully create a token', async () => {
            jest.spyOn(privacyIdeaAdministrationService, 'initializeSoftwareToken').mockResolvedValue('token123');
            const response: string = await sut.initializeSoftwareToken({ userName: 'user1' });
            expect(response).toEqual('token123');
        });
    });

    describe('PrivacyIdeaAdministrationController getTwoAuthState', () => {
        let privacyIdeaAdministrationService: PrivacyIdeaAdministrationService;

        beforeEach(() => {
            privacyIdeaAdministrationService = module.get<PrivacyIdeaAdministrationService>(
                PrivacyIdeaAdministrationService,
            );
        });

        it('should successfully retrieve token state', async () => {
            const mockTokenState: PrivacyIdeaToken = {
                serial: 'serial123',
                info: {
                    tokenkind: 'software',
                    timeWindow: '30',
                    hashlib: 'sha1',
                    timeStep: '30',
                    timeShift: '0',
                },
                active: false,
                count: 0,
                count_window: 0,
                description: '',
                failcount: 0,
                id: 0,
                locked: false,
                maxfail: 0,
                otplen: 0,
                realms: [],
                resolver: '',
                revoked: false,
                rollout_state: '',
                sync_window: 0,
                tokengroup: [],
                tokentype: '',
                user_editable: false,
                user_id: '',
                user_realm: '',
                username: '',
            };

            jest.spyOn(privacyIdeaAdministrationService, 'getTwoAuthState').mockResolvedValue(mockTokenState);
            const response: TokenStateResponse = await sut.getTwoAuthState('user1');
            expect(response).toEqual(new TokenStateResponse(mockTokenState));
        });
    });
});
