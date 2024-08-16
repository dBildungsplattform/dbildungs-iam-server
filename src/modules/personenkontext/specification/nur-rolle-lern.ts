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

    public async checkRollenartLern(personenkontext: Personenkontext<false>): Promise<boolean> {
        // Fetch all personenkontexte for the person
        const existingPersonenkontexte: Personenkontext<true>[] = await this.personenkontextRepo.findByPerson(
            personenkontext.personId,
        );

        // Check if any existing Personenkontext has a role of type LERN
        const rollen: Option<Rolle<true>>[] = await Promise.all(
            existingPersonenkontexte.map((pk: Personenkontext<true>) => this.rolleRepo.findById(pk.rolleId)),
        );

        const hasLernRolle: boolean = rollen.some((rolle: Option<Rolle<true>>) => rolle?.rollenart === RollenArt.LERN);

        if (hasLernRolle) {
            // If any existing Personenkontext has a role of type LERN,
            // check if the new Personenkontext also has a role of type LERN
            const newRolle: Option<Rolle<true>> = await this.rolleRepo.findById(personenkontext.rolleId);

            if (newRolle && newRolle.rollenart !== RollenArt.LERN) {
                return false;
            }
        }

        return true;
    }
}
