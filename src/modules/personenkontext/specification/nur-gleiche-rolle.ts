import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { Rolle } from '../../rolle/domain/rolle.js';

export class CheckRollenartSpecification {
    public constructor(
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly rolleRepo: RolleRepo,
    ) {}

    public async checkRollenart(sentPKs: Personenkontext<boolean>[]): Promise<boolean> {
        // Fetch all personenkontexte for the person
        let existingPKs: Personenkontext<true>[] = [];

        if (sentPKs[0]?.personId) {
            existingPKs = await this.personenkontextRepo.findByPerson(sentPKs[0]?.personId);
        }

        // Get roles for existing and sent PKs
        const existingRollen: Rolle<true>[] = await this.getUniqueRollenFromPersonenkontexte(existingPKs);
        const sentRollen: Rolle<true>[] = await this.getUniqueRollenFromPersonenkontexte(sentPKs);

        // If there are no existing roles, any new roles are allowed
        if (existingRollen.length === 0) {
            return true;
        }

        // Get the RollenArt of existing PKs (assuming all existing PKs have the same RollenArt)
        const existingRollenArt: RollenArt | undefined = existingRollen[0]?.rollenart;

        // Check if all sent roles match the existing RollenArt
        const allSentRollenMatchExisting: boolean = sentRollen.every(
            (rolle: Rolle<true>) => rolle.rollenart === existingRollenArt,
        );

        return allSentRollenMatchExisting;
    }

    private async getUniqueRollenFromPersonenkontexte(
        personenkontexte: Personenkontext<boolean>[],
    ): Promise<Rolle<true>[]> {
        const uniqueRolleIds: Set<string> = new Set(personenkontexte.map((pk: Personenkontext<boolean>) => pk.rolleId));
        const mapRollen: Map<string, Rolle<true>> = await this.rolleRepo.findByIds(Array.from(uniqueRolleIds));
        return Array.from(mapRollen.values());
    }
}
