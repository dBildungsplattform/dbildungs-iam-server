import { Injectable } from '@nestjs/common';
import { PersonID } from '../../../shared/types/aggregate-ids.types.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { EmailAddress } from './email-address.js';
import { Email } from './email.js';
import { EmailGenerator } from './email-generator.js';
import { EmailRepo } from '../persistence/email.repo.js';
import { Person } from '../../person/domain/person.js';
import { EntityNotFoundError } from '../../../shared/error/index.js';

@Injectable()
export class EmailFactory {
    private emailGenerator: EmailGenerator;

    public constructor(
        private readonly emailRepo: EmailRepo,
        private readonly personRepository: PersonRepository,
    ) {
        this.emailGenerator = new EmailGenerator(this.emailRepo);
    }

    public construct(personId: PersonID, emailAddress: EmailAddress<true>): Email {
        return Email.construct(personId, emailAddress);
    }

    public async createNew(personId: PersonID): Promise<Result<Email>> {
        const person: Option<Person<true>> = await this.personRepository.findById(personId);
        if (!person) {
            return {
                ok: false,
                error: new EntityNotFoundError('Person', personId),
            };
        }
        const generatedAddressResult: Result<string> = await this.emailGenerator.generateAddress(
            person.vorname,
            person.familienname,
        );
        if (!generatedAddressResult.ok) {
            return {
                ok: false,
                error: generatedAddressResult.error,
            };
        }

        const newEmailAddress: EmailAddress<false> = new EmailAddress<false>(
            undefined,
            undefined,
            undefined,
            personId,
            generatedAddressResult.value,
            true,
        );

        return {
            ok: true,
            value: Email.construct(personId, newEmailAddress),
        };
    }
}
