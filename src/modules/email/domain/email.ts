import { EmailID, PersonID } from '../../../shared/types/index.js';
import { EmailGeneratorService } from './email-generator.service.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';
import { EmailInvalidError } from '../error/email-invalid.error.js';
import { EmailAddress } from './email-address.js';
import { EmailAddressRepo } from '../persistence/email-address.repo.js';

export declare type IsEmailValid<T, IsValid extends boolean> = IsValid extends true ? T : Option<T>;

export class Email<WasPersisted extends boolean, IsValid extends boolean> {
    private constructor(
        public readonly id: Persisted<EmailID, WasPersisted>,
        public readonly createdAt: Persisted<Date, WasPersisted>,
        public readonly updatedAt: Persisted<Date, WasPersisted>,
        public readonly personId: PersonID,
        public readonly emailAddresses: IsEmailValid<EmailAddress[], IsValid>,
        public readonly emailGeneratorService: EmailGeneratorService,
        public readonly personRepository: PersonRepository,
        public readonly emailAddressRepo: EmailAddressRepo,
    ) {}

    public static createNew(
        personId: PersonID,
        emailGeneratorService: EmailGeneratorService,
        personRepository: PersonRepository,
        emailAddressRepo: EmailAddressRepo,
    ): Email<false, false> {
        return new Email<false, false>(
            undefined,
            undefined,
            undefined,
            personId,
            undefined,
            emailGeneratorService,
            personRepository,
            emailAddressRepo,
        );
    }

    public static construct<WasPersisted extends boolean = true, IsValid extends boolean = true>(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        personId: PersonID,
        emailAddresses: EmailAddress[],
        emailGeneratorService: EmailGeneratorService,
        personRepository: PersonRepository,
        emailAddressRepo: EmailAddressRepo,
    ): Email<WasPersisted, IsValid> {
        return new Email(
            id,
            createdAt,
            updatedAt,
            personId,
            emailAddresses,
            emailGeneratorService,
            personRepository,
            emailAddressRepo,
        );
    }

    public async enable(): Promise<Result<Email<WasPersisted, true>>> {
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
        const emailAddress: EmailAddress = new EmailAddress('123', generatedName.value, true);
        return {
            ok: true,
            value: new Email(
                this.id,
                this.createdAt,
                this.updatedAt,
                this.personId,
                [emailAddress],
                this.emailGeneratorService,
                this.personRepository,
                this.emailAddressRepo,
            ),
        };
    }

    public async disable(): Promise<boolean> {
        if (!this.emailAddresses) return false;

        for (const emailAddress of this.emailAddresses) {
            emailAddress.enabled = false;
            await this.emailAddressRepo.update(emailAddress);
        }
        return true;
    }

    public isEnabled(): boolean {
        if (!this.emailAddresses) return false;
        return this.emailAddresses.some((emailAddress: EmailAddress) => emailAddress.enabled);
    }
}
