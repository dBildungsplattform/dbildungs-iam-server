import { PersonID } from '../../../shared/types/index.js';
import { EmailGeneratorService } from './email-generator.service.js';

export class Email<WasPersisted extends boolean> {
    private constructor(
        public readonly emailGeneratorService: EmailGeneratorService,
        public readonly id: Persisted<string, WasPersisted>,
        public readonly createdAt: Persisted<Date, WasPersisted>,
        public readonly updatedAt: Persisted<Date, WasPersisted>,
        public readonly name: string,
        public readonly enabled: boolean,
        public readonly personId: PersonID,
    ) {}

    public static createNew(
        emailGeneratorService: EmailGeneratorService,
        name: string,
        enabled: boolean,
        personId: PersonID,
    ): Email<false> {
        return new Email(emailGeneratorService, undefined, undefined, undefined, name, enabled, personId);
    }

    public static construct<WasPersisted extends boolean = false>(
        emailGeneratorService: EmailGeneratorService,
        id: Persisted<string, WasPersisted>,
        createdAt: Persisted<Date, WasPersisted>,
        updatedAt: Persisted<Date, WasPersisted>,
        name: string,
        enabled: boolean,
        personId: PersonID,
    ): Email<WasPersisted> {
        return new Email(emailGeneratorService, id, createdAt, updatedAt, name, enabled, personId);
    }

    /*public async activate(): Promise<Result<void>> {
        const emails: Email<true>[] = await this.emailRepo.findByPersonId(this.personId);

        if (emails.length <= 0) {
            const generatedName: Result<string> = await this.emailGeneratorService.generateName(this.name, this.name);

            if (!generatedName.ok) {
                return generatedName;
            }
        }

        return {
            ok: true,
            value: undefined,
        }
    }*/
}
