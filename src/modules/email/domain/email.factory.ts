import { Injectable } from '@nestjs/common';
import { PersonID } from '../../../shared/types/aggregate-ids.types.js';
import { Email } from './email.js';
import { EmailGeneratorService } from './email-generator.service.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';

@Injectable()
export class EmailFactory {
    public constructor(
        private readonly emailGeneratorService: EmailGeneratorService,
        private readonly personRepository: PersonRepository,
    ) {}

    public construct<WasPersisted extends boolean = false>(
        id: Persisted<string, WasPersisted>,
        createdAt: Persisted<Date, WasPersisted>,
        updatedAt: Persisted<Date, WasPersisted>,
        enabled: boolean,
        personId: PersonID,
        address: string,
    ): Email<WasPersisted> {
        return Email.construct(
            id,
            createdAt,
            updatedAt,
            enabled,
            personId,
            address,
            this.emailGeneratorService,
            this.personRepository,
        );
    }

    public createNew(enabled: boolean, personId: PersonID): Email<false> {
        return Email.createNew(enabled, personId, this.emailGeneratorService, this.personRepository);
    }
}
