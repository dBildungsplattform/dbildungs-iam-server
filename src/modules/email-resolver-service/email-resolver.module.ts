import { Module } from "@nestjs/common";
import { LoggerModule } from "../../core/logging/logger.module";
import { EmailRepo } from "../email/persistence/email.repo";
import { RolleRepo } from "../rolle/repo/rolle.repo";
import { EmailResolverService } from "./email-resolver.service";
import { ClassLogger } from "../../core/logging/class-logger";
import { HttpService } from "@nestjs/axios";
import { RolleFactory } from "../rolle/domain/rolle.factory";
import { EventRoutingLegacyKafkaService } from "../../core/eventbus/services/event-routing-legacy-kafka.service";
import { ServiceProviderRepo } from "../service-provider/repo/service-provider.repo";
import { OrganisationRepository } from "../organisation/persistence/organisation.repository";
import { EventService } from "../../core/eventbus";
import { KafkaEventService } from "../../core/eventbus/services/kafka-event.service";
import { EntityManager } from "@mikro-orm/core";

@Module({
    imports: [LoggerModule],
    providers: [
        EmailResolverService,
        HttpService,
        EmailRepo,
        RolleRepo,
        ClassLogger,
        RolleFactory,
        EventRoutingLegacyKafkaService,
        ServiceProviderRepo,
        OrganisationRepository,
        EventService,
        KafkaEventService,
        EntityManager
    ],
    exports: [EmailResolverService],
})
export class EmailResolverModule {}
