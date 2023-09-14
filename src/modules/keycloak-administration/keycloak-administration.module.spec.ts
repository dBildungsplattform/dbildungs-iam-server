import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, MapperTestModule } from '../../../test/utils/index.js';
import { KeycloakUserService } from './domain/keycloak-user.service.js';
import { KeycloakAdministrationModule } from './keycloak-administration.module.js';
import { UserMapperProfile } from './domain/keycloak-client/user.mapper.profile.js';
import { KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';
import { KeycloakAdministrationService } from './domain/keycloak-admin-client.service.js';

describe('KeycloakAdministrationModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, MapperTestModule, KeycloakAdministrationModule],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve KeycloakUserService', () => {
            expect(module.get(KeycloakUserService)).toBeInstanceOf(KeycloakUserService);
        });

        it('should resolve UserMapperProfile', () => {
            expect(module.get(UserMapperProfile)).toBeInstanceOf(UserMapperProfile);
        });

        it('should resolve KeycloakAdminClient', () => {
            expect(module.get(KeycloakAdminClient)).toBeInstanceOf(KeycloakAdminClient);
        });

        it('should resolve KeycloakAdministrationService', () => {
            expect(module.get(KeycloakAdministrationService)).toBeInstanceOf(KeycloakAdministrationService);
        });
    });
});
