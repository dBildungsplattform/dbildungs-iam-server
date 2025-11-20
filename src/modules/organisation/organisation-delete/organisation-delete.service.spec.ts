import { Test, TestingModule } from "@nestjs/testing"
import { OrganisationDeleteService } from "./organisation-delete.service";
import { createMock } from "@golevelup/ts-jest";
import { EventRoutingLegacyKafkaService } from "../../../core/eventbus/services/event-routing-legacy-kafka.service";
import { DBiamPersonenkontextRepo } from "../../personenkontext/persistence/dbiam-personenkontext.repo";
import { OrganisationController } from "../api/organisation.controller";
import { OrganisationService } from "../domain/organisation.service";
import { OrganisationRepository } from "../persistence/organisation.repository";
import { RolleRepo } from "../../rolle/repo/rolle.repo";
import { ServiceProviderRepo } from "../../service-provider/repo/service-provider.repo";

describe('OrganisationDeleteService', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                OrganisationDeleteService,
                {
                    provide: OrganisationRepository,
                    useValue: createMock<OrganisationRepository>(),
                },
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
                {
                    provide: ServiceProviderRepo,
                    useValue: createMock<ServiceProviderRepo>(),
                },
            ],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });
})