import { PersonID } from '../../../shared/types/index.js';
import { EmailGeneratorService } from './email-generator.service.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';
import { EmailInvalidError } from '../error/email-invalid.error.js';
import { EmailAddress } from './email-address.js';

export class Email<WasPersisted extends boolean> {
    private constructor(
        public readonly personId: PersonID,
        public readonly emailGeneratorService: EmailGeneratorService,
        public readonly personRepository: PersonRepository,
        public readonly emailAddresses?: EmailAddress<boolean>[],
    ) {}

    public static createNew(
        personId: PersonID,
        emailGeneratorService: EmailGeneratorService,
        personRepository: PersonRepository,
    ): Email<false> {
        return new Email<false>(personId, emailGeneratorService, personRepository, undefined);
    }

    public static construct<WasPersisted extends boolean = true>(
        personId: PersonID,
        emailGeneratorService: EmailGeneratorService,
        personRepository: PersonRepository,
        emailAddresses: EmailAddress<boolean>[],
    ): Email<WasPersisted> {
        return new Email(personId, emailGeneratorService, personRepository, emailAddresses);
    }

    public async enable(): Promise<Result<Email<WasPersisted>>> {
        if (this.emailAddresses && this.emailAddresses[0]) {
            this.emailAddresses[0].enabled = true;
            return {
                ok: true,
                value: new Email(this.personId, this.emailGeneratorService, this.personRepository, this.emailAddresses),
            };
        }
        const person: Option<Person<true>> = await this.personRepository.findById(this.personId);
        if (!person) {
            return {
                ok: false,
                error: new EmailInvalidError(),
            };
        }
        const generatedName: Result<string> = await this.emailGeneratorService.generateAddress(
            person.vorname,
            person.familienname,
        );
        if (!generatedName.ok) {
            return {
                ok: false,
                error: new EmailInvalidError(),
            };
        }
        const newEmailAddress: EmailAddress<boolean> = new EmailAddress(
            undefined,
            undefined,
            undefined,
            this.personId,
            generatedName.value,
            true,
        );
        return {
            ok: true,
            value: new Email(this.personId, this.emailGeneratorService, this.personRepository, [newEmailAddress]),
        };
    }

    public disable(): boolean {
        if (!this.emailAddresses || this.emailAddresses.length <= 0) return false;

        for (const emailAddress of this.emailAddresses) {
            emailAddress.enabled = false;
        }
        return true;
    }

    public isEnabled(): boolean {
        if (!this.emailAddresses || this.emailAddresses.length <= 0) return false;
        return this.emailAddresses.some((emailAddress: EmailAddress<boolean>) => emailAddress.enabled);
    }

    public get currentAddress(): Option<string> {
        if (!this.emailAddresses || this.emailAddresses.length <= 0) return undefined;

        for (const emailAddress of this.emailAddresses) {
            if (emailAddress.enabled) return emailAddress.address;
        }

        return undefined;
    }
}
