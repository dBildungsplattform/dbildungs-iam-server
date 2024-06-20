import { PersonID } from '../../../shared/types/index.js';
import { EmailGeneratorService } from './email-generator.service.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';
import { EmailInvalidError } from '../error/email-invalid.error.js';

export declare type IsEmailValid<T, IsValid extends boolean> = IsValid extends true ? T : Option<T>;

export class Email<WasPersisted extends boolean, IsValid extends boolean> {
    private constructor(
        public readonly id: Persisted<string, WasPersisted>,
        public readonly createdAt: Persisted<Date, WasPersisted>,
        public readonly updatedAt: Persisted<Date, WasPersisted>,
        public readonly enabled: boolean,
        public readonly personId: PersonID,
        public address: IsEmailValid<string, IsValid>,
        public readonly emailGeneratorService: EmailGeneratorService,
        public readonly personRepository: PersonRepository,
    ) {}

    public static createNew(
        enabled: boolean,
        personId: PersonID,
        emailGeneratorService: EmailGeneratorService,
        personRepository: PersonRepository,
    ): Email<false, false> {
        return new Email<false, false>(
            undefined,
            undefined,
            undefined,
            enabled,
            personId,
            undefined,
            emailGeneratorService,
            personRepository,
        );
    }

    public static construct<WasPersisted extends boolean = true, IsValid extends boolean = false>(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        enabled: boolean,
        personId: PersonID,
        address: IsEmailValid<string, IsValid>,
        emailGeneratorService: EmailGeneratorService,
        personRepository: PersonRepository,
    ): Email<WasPersisted, IsValid> {
        return new Email(id, createdAt, updatedAt, enabled, personId, address, emailGeneratorService, personRepository);
    }

    public async activate(): Promise<Result<Email<WasPersisted, true>>> {
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
        return {
            ok: true,
            value: new Email(
                this.id,
                this.createdAt,
                this.updatedAt,
                this.enabled,
                this.personId,
                generatedName.value,
                this.emailGeneratorService,
                this.personRepository,
            ),
        };
    }
}
