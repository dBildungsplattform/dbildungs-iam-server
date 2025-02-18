import { DomainError, MismatchedRevisionError } from '../../../shared/error/index.js';
import { MeldungValidator } from '../../../shared/validation/meldung-validator.js';
import { MeldungInhaltError } from '../../person/domain/meldung-inhalt.error.js';
import { MeldungStatus } from '../persistence/meldung.entity.js';

export class Meldung<WasPersisted extends boolean> {
    private constructor(
        public id: Persisted<string, WasPersisted>,
        public createdAt: Persisted<Date, WasPersisted>,
        public updatedAt: Persisted<Date, WasPersisted>,
        public inhalt: string,
        public status: MeldungStatus,
        public revision: number,
    ) {}

    public static construct<WasPersisted extends boolean = false>(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        inhalt: string,
        status: MeldungStatus,
        revision: number,
    ): Meldung<WasPersisted> {
        return new Meldung(id, createdAt, updatedAt, inhalt, status, revision);
    }

    public static createNew(inhalt: string, status: MeldungStatus): Meldung<false> | DomainError {
        if (!MeldungValidator.isMeldungValid(inhalt)) {
            return new MeldungInhaltError();
        }
        return new Meldung(undefined, undefined, undefined, inhalt, status, 1);
    }

    public update(revision: number, inhalt: string, status: MeldungStatus): void | DomainError {
        if (this.revision !== revision) {
            return new MismatchedRevisionError(
                `Revision ${revision} does not match revision ${this.revision} of stored Meldung.`,
            );
        }
        if (!MeldungValidator.isMeldungValid(inhalt)) {
            return new MeldungInhaltError();
        }
        this.inhalt = inhalt;
        this.status = status;
        this.revision = this.revision + 1;
    }
}
