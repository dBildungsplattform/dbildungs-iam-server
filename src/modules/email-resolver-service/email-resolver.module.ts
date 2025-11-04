import { EntityManager } from "@mikro-orm/core";
import { HttpService } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventService } from "../../core/eventbus";
import { EventRoutingLegacyKafkaService } from "../../core/eventbus/services/event-routing-legacy-kafka.service";
import { KafkaEventService } from "../../core/eventbus/services/kafka-event.service";
import { ClassLogger } from "../../core/logging/class-logger";
import { LoggerModule } from "../../core/logging/logger.module";
import { EmailRepo } from "../email/persistence/email.repo";
import { OrganisationRepository } from "../organisation/persistence/organisation.repository";
import { RolleFactory } from "../rolle/domain/rolle.factory";
import { RolleRepo } from "../rolle/repo/rolle.repo";
import { ServiceProviderRepo } from "../service-provider/repo/service-provider.repo";
import { EmailResolverService } from "./email-resolver.service";

@Module({
    imports: [LoggerModule],
    providers: [
        EmailResolverService,
        ConfigService,
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
