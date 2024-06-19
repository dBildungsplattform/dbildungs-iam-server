import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    MapperTestModule,
    KeycloakConfigTestModule,
} from '../../../test/utils/index.js';
import { KeycloakUserService } from './domain/keycloak-user.service.js';
import { KeycloakAdministrationModule } from './keycloak-administration.module.js';
import { UserMapperProfile } from './domain/keycloak-client/user.mapper.profile.js';
import { KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';
import { KeycloakAdministrationService } from './domain/keycloak-admin-client.service.js';
import { PersonenkontextFactory } from '../personenkontext/domain/personenkontext.factory.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { PersonModule } from '../person/person.module.js';
import { OrganisationRepository } from '../organisation/persistence/organisation.repository.js';

describe('KeycloakAdministrationModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                MapperTestModule,
                KeycloakAdministrationModule,
                DatabaseTestModule.forRoot(),
                KeycloakConfigTestModule.forRoot(),
                RolleModule,
                PersonModule,
            ],
            providers: [PersonenkontextFactory, OrganisationRepository],
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
