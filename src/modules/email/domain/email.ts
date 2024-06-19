import { PersonID } from '../../../shared/types/index.js';
import { EmailGeneratorService } from './email-generator.service.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';
import { EntityNotFoundError } from '../../../shared/error/index.js';

export class Email<WasPersisted extends boolean> {
    private constructor(
        public readonly id: Persisted<string, WasPersisted>,
        public readonly createdAt: Persisted<Date, WasPersisted>,
        public readonly updatedAt: Persisted<Date, WasPersisted>,
        public readonly enabled: boolean,
        public readonly personId: PersonID,
        public address: string,
        public readonly emailGeneratorService: EmailGeneratorService,
        public readonly personRepository: PersonRepository,
    ) {}

    public static createNew(
        enabled: boolean,
        personId: PersonID,
        emailGeneratorService: EmailGeneratorService,
        personRepository: PersonRepository,
    ): Email<false> {
        return new Email(
            undefined,
            undefined,
            undefined,
            enabled,
            personId,
            'undefined',
            emailGeneratorService,
            personRepository,
        );
    }

    public static construct<WasPersisted extends boolean = false>(
        id: Persisted<string, WasPersisted>,
        createdAt: Persisted<Date, WasPersisted>,
        updatedAt: Persisted<Date, WasPersisted>,
        enabled: boolean,
        personId: PersonID,
        address: string,
        emailGeneratorService: EmailGeneratorService,
        personRepository: PersonRepository,
    ): Email<WasPersisted> {
        return new Email(id, createdAt, updatedAt, enabled, personId, address, emailGeneratorService, personRepository);
    }

    public async activate(): Promise<Result<string>> {
        const person: Option<Person<true>> = await this.personRepository.findById(this.personId);
        if (!person) {
            return {
                ok: false,
                error: new EntityNotFoundError(),
            };
        }
        const generatedName: Result<string> = await this.emailGeneratorService.generateAddress(
            person.vorname,
            person.familienname,
        );
        if (!generatedName.ok) {
            return generatedName;
        }
        this.address = generatedName.value;
        return {
            ok: true,
            value: generatedName.value,
        };
    }
}
