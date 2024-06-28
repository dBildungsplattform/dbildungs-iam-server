import { EmailID, PersonID } from '../../../shared/types/index.js';
import { EmailGeneratorService } from './email-generator.service.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';
import { EmailInvalidError } from '../error/email-invalid.error.js';
import { EmailAddress } from './email-address.js';

export type EmailAddressProperties = {
    vorname: string;
    familienname: string;
};

export class Email<WasPersisted extends boolean> {
    private constructor(
        public readonly id: Persisted<EmailID, WasPersisted>,
        public readonly createdAt: Persisted<Date, WasPersisted>,
        public readonly updatedAt: Persisted<Date, WasPersisted>,
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
        return new Email<false>(
            undefined,
            undefined,
            undefined,
            personId,
            emailGeneratorService,
            personRepository,
            undefined,
        );
    }

    public static construct<WasPersisted extends boolean = true>(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        personId: PersonID,
        emailGeneratorService: EmailGeneratorService,
        personRepository: PersonRepository,
        emailAddresses: EmailAddress<true>[],
    ): Email<WasPersisted> {
        return new Email(id, createdAt, updatedAt, personId, emailGeneratorService, personRepository, emailAddresses);
    }

    public async enable(): Promise<Result<Email<WasPersisted>>> {
        const person: Option<Person<true>> = await this.personRepository.findById(this.personId);
        if (!person) {
            return {
                ok: false,
                error: new EmailInvalidError(),
            };
        }

        if (this.emailAddresses) {
            for (const emailAddress of this.emailAddresses) {
                //avoid enabling of email-addresses which are no longer matching current persons vorname and familienname
                if (
                    await this.emailGeneratorService.isEqual(emailAddress.address, person.vorname, person.familienname)
                ) {
                    emailAddress.enabled = true;
                    return {
                        ok: true,
                        value: new Email(
                            this.id,
                            this.createdAt,
                            this.updatedAt,
                            this.personId,
                            this.emailGeneratorService,
                            this.personRepository,
                            this.emailAddresses,
                        ),
                    };
                }
            }
        }

        return this.createNewAddress();
    }

    private async createNewAddress(names?: EmailAddressProperties): Promise<Result<Email<WasPersisted>>> {
        const person: Option<Person<true>> = await this.personRepository.findById(this.personId);
        if (!person) {
            return {
                ok: false,
                error: new EmailInvalidError(),
            };
        }
        let vorname: string = person.vorname;
        let familienName: string = person.familienname;
        if (names) {
            vorname = names.vorname;
            familienName = names.familienname;
        }
        const generatedAddress: Result<string> = await this.emailGeneratorService.generateAddress(
            vorname,
            familienName,
        );
        if (!generatedAddress.ok) {
            return {
                ok: false,
                error: new EmailInvalidError(),
            };
        }
        const newEmailAddress: EmailAddress<false> = new EmailAddress<false>(undefined, generatedAddress.value, true);
        let newAddresses: EmailAddress<boolean>[] = [newEmailAddress];
        if (this.emailAddresses) {
            newAddresses = newAddresses.concat(this.emailAddresses);
        }
        return {
            ok: true,
            value: new Email(
                this.id,
                this.createdAt,
                this.updatedAt,
                this.personId,
                this.emailGeneratorService,
                this.personRepository,
                newAddresses,
            ),
        };
    }

    public disable(): boolean {
        if (!this.emailAddresses) return false;

        for (const emailAddress of this.emailAddresses) {
            emailAddress.enabled = false;
        }
        return true;
    }

    public async changeAddress(newNames: EmailAddressProperties): Promise<Result<Email<WasPersisted>>> {
        return this.createNewAddress(newNames);
    }

    public isEnabled(): boolean {
        if (!this.emailAddresses) return false;
        return this.emailAddresses.some((emailAddress: EmailAddress<boolean>) => emailAddress.enabled);
    }

    public get currentAddress(): Option<string> {
        if (!this.emailAddresses) return undefined;

        for (const emailAddress of this.emailAddresses) {
            if (emailAddress.enabled) return emailAddress.address;
        }

        return undefined;
    }
}
