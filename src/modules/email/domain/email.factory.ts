import { Injectable } from '@nestjs/common';
import { PersonID } from '../../../shared/types/aggregate-ids.types.js';
import { Email } from './email.js';
import { EmailGeneratorService } from './email-generator.service.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { EmailAddress } from './email-address.js';

@Injectable()
export class EmailFactory {
    public constructor(
        private readonly emailGeneratorService: EmailGeneratorService,
        private readonly personRepository: PersonRepository,
    ) {}

    public construct(personId: PersonID, emailAddress: EmailAddress<true>): Email<true> {
        return Email.construct(personId, this.emailGeneratorService, this.personRepository, emailAddress);
    }

    public createNew(personId: PersonID): Email<false> {
        return Email.createNew(personId, this.emailGeneratorService, this.personRepository);
    }
}
