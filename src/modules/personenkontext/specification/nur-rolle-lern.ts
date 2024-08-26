import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { Rolle } from '../../rolle/domain/rolle.js';

export class CheckRollenartLernSpecification {
    public constructor(
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly rolleRepo: RolleRepo,
    ) {}

    public async checkRollenartLern(sentPKs: Personenkontext<boolean>[]): Promise<boolean> {
        // Fetch all personenkontexte for the person
        let existingPKs: Personenkontext<true>[] = [];

        if (sentPKs[0]?.personId) {
            existingPKs = await this.personenkontextRepo.findByPerson(sentPKs[0]?.personId);
        }

        // Step 1: Check if the sent PKs have any LERN roles
        const sentRollen: Rolle<true>[] = await this.getUniqueRollenFromPersonenkontexte(sentPKs);
        const hasAnyLernInSent: boolean = sentRollen.some((rolle: Rolle<true>) => rolle.rollenart === RollenArt.LERN);

        // Step 2: Check if existing PKs have LERN roles
        const hasLernInExisting: boolean = await this.hasAnyPersonenkontextWithRollenartLern(existingPKs);

        // Early return: If neither the existing PKs nor the sent PKs contain LERN roles, it's safe to return undefined
        if (!hasLernInExisting && !hasAnyLernInSent) {
            return true;
        }

        // Step 3: Check if sent PKs contain only LERN roles
        const hasOnlyRollenartLern: boolean = sentRollen.every(
            (rolle: Rolle<true>) => rolle.rollenart === RollenArt.LERN,
        );

        // Step 4: If there are LERN roles in existing PKs, ensure sent PKs do not mix LERN with other types
        if (hasLernInExisting && !hasOnlyRollenartLern) {
            return false;
        }

        // Step 5: Check if sent PKs alone mix LERN and other types
        const containsMixedRollen: boolean =
            hasAnyLernInSent && sentRollen.some((rolle: Rolle<true>) => rolle.rollenart !== RollenArt.LERN);

        if (containsMixedRollen) {
            return false;
        }

        return true;
    }

    private async getUniqueRollenFromPersonenkontexte(
        personenkontexte: Personenkontext<boolean>[],
    ): Promise<Rolle<true>[]> {
        const uniqueRolleIds: Set<string> = new Set(personenkontexte.map((pk: Personenkontext<boolean>) => pk.rolleId));
        const mapRollen: Map<string, Rolle<true>> = await this.rolleRepo.findByIds(Array.from(uniqueRolleIds));
        return Array.from(mapRollen.values());
    }

    private async hasAnyPersonenkontextWithRollenartLern(personenkontexte: Personenkontext<true>[]): Promise<boolean> {
        const foundRollen: Rolle<true>[] = await this.getUniqueRollenFromPersonenkontexte(personenkontexte);
        return foundRollen.some((rolle: Rolle<true>) => rolle.rollenart === RollenArt.LERN);
    }
}
