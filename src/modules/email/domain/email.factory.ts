import { Injectable } from '@nestjs/common';
import { PersonID } from '../../../shared/types/aggregate-ids.types.js';
import { Email } from './email.js';
import {EmailGeneratorService} from "./email-generator.service.js";

@Injectable()
export class EmailFactory {
    public constructor(private readonly emailGeneratorService: EmailGeneratorService) {}

    public construct<WasPersisted extends boolean = false>(
        id: Persisted<string, WasPersisted>,
        createdAt: Persisted<Date, WasPersisted>,
        updatedAt: Persisted<Date, WasPersisted>,
        name: string,
        enabled: boolean,
        personId: PersonID,
    ): Email<WasPersisted> {
        return Email.construct(this.emailGeneratorService, id, createdAt, updatedAt, name, enabled, personId);
    }

    public createNew(name: string, enabled: boolean, personId: PersonID): Email<false> {
        return Email.createNew(this.emailGeneratorService, name, enabled, personId);
    }
}
