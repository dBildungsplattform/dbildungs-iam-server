import { RolleDomainError } from '../../domain/rolle-domain.error.js';

export class RollenartNurFuerSchuleError extends RolleDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Rollen dieser Rollenart können nur für Organisationen des Typs SCHULE angelegt werden.`,
            undefined,
            details,
        );
    }
}
