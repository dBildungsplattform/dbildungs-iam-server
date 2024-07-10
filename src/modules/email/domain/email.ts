import { PersonID } from '../../../shared/types/index.js';
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
        public readonly personId: PersonID,
        public readonly emailGeneratorService: EmailGeneratorService,
        public readonly personRepository: PersonRepository,
        public readonly emailAddress?: EmailAddress<boolean>,
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
        emailAddresses: EmailAddress<boolean>,
    ): Email<WasPersisted> {
        return new Email(personId, emailGeneratorService, personRepository, emailAddresses);
    }

    public async enable(): Promise<Result<Email<WasPersisted>>> {
        const person: Option<Person<true>> = await this.personRepository.findById(this.personId);
        if (!person) {
            return {
                ok: false,
                error: new EmailInvalidError(),
            };
        }

        if (this.emailAddress) {
            //avoid enabling of email-addresses which are no longer matching current persons vorname and familienname
            if (this.emailGeneratorService.isEqual(this.emailAddress.address, person.vorname, person.familienname)) {
                this.emailAddress.enabled = true;
                return {
                    ok: true,
                    value: new Email(
                        this.personId,
                        this.emailGeneratorService,
                        this.personRepository,
                        this.emailAddress,
                    ),
                };
            }

            this.emailAddress.enabled = true;
            return {
                ok: true,
                value: new Email(this.personId, this.emailGeneratorService, this.personRepository, this.emailAddress),
            };
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
        const newEmailAddress: EmailAddress<false> = new EmailAddress<false>(
            undefined,
            undefined,
            undefined,
            this.personId,
            generatedAddress.value,
            true,
        );

        return {
            ok: true,
            value: new Email(this.personId, this.emailGeneratorService, this.personRepository, newEmailAddress),
        };
    }

    public disable(): boolean {
        if (!this.emailAddress) return false;

        this.emailAddress.enabled = false;

        return true;
    }

    public async changeAddress(newNames: EmailAddressProperties): Promise<Result<Email<WasPersisted>>> {
        return this.createNewAddress(newNames);
    }

    public isEnabled(): boolean {
        return !!this.emailAddress && this.emailAddress.enabled;
    }

    public get currentAddress(): Option<string> {
        if (!this.emailAddress || !this.emailAddress.enabled) return undefined;

        return this.emailAddress.address;
    }
}
