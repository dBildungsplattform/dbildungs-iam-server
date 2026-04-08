import { IPersonPermissions } from '../../shared/permissions/person-permissions.interface.js';
import { OrganisationID, PersonID } from '../../shared/types/index.js';
import { OrganisationsTyp } from '../organisation/domain/organisation.enums.js';
import { RollenSystemRecht, RollenSystemRechtEnum } from '../rolle/domain/systemrecht.js';
import {
    PermittedOrgas,
    PersonenkontextRolleWithOrganisation,
    PersonFields,
    PersonPermissions,
} from '../authentication/domain/person-permissions.js';
import { OrganisationRepository } from '../organisation/persistence/organisation.repository.js';
import { Organisation } from '../organisation/domain/organisation.js';
import {
    DBiamPersonenkontextRepo,
    KontextWithOrgaAndRolle,
} from '../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { ClassLogger } from '../../core/logging/class-logger.js';

export type EscalatedPermissionAtOrga = {
    orgaId: OrganisationID | 'ROOT';
    systemrechte: Array<RollenSystemRechtEnum> | 'ALL';
};

const ESCALATED_PERSON_PERMISSIONS_BRAND: string = 'ESCALATED_PERSON_PERMISSIONS_BRAND';

export function isEscalatedPersonPermissions(obj: unknown): obj is EscalatedPersonPermissions {
    return (
        typeof obj === 'object' && obj !== null && 'brand' in obj && obj.brand === ESCALATED_PERSON_PERMISSIONS_BRAND
    );
}

export class EscalatedPersonPermissions implements IPersonPermissions {
    public readonly id: string;

    private escalatedPermissions: Array<EscalatedPermissionAtOrga>;

    private readonly cachedPersonFields: PersonFields;

    private readonly brand: string = ESCALATED_PERSON_PERMISSIONS_BRAND;

    private constructor(
        id: string,
        escalatedPermissions: Array<EscalatedPermissionAtOrga>,
        private readonly organisationRepo: OrganisationRepository,
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly logger: ClassLogger,
    ) {
        this.id = id;
        this.escalatedPermissions = escalatedPermissions;
        this.cachedPersonFields = {
            id: id,
            keycloakUserId: undefined,
            vorname: `EscalatedPersonPermissions-${id}`,
            familienname: `EscalatedPersonPermissions-${id}`,
            username: `EscalatedPersonPermissions-${id}`,
            updatedAt: new Date(),
        };

        this.logger.info(
            `Created new ${this.brand} for ${id} with escalated permissions: ${JSON.stringify(escalatedPermissions)}`,
        );
    }

    public static async fromPersonPermissions(
        personPermissions: PersonPermissions,
        additionalEscalatedPermissions: Array<EscalatedPermissionAtOrga>,
        organisationRepo: OrganisationRepository,
        personenkontextRepo: DBiamPersonenkontextRepo,
        logger: ClassLogger,
    ): Promise<EscalatedPersonPermissions> {
        const allEscalatedPermissions: EscalatedPermissionAtOrga[] = additionalEscalatedPermissions;

        const allKontexte: PersonenkontextRolleWithOrganisation[] =
            await personPermissions.getPersonenkontexteWithRolesAndOrgs();

        allKontexte.forEach((kontext: PersonenkontextRolleWithOrganisation) => {
            const escalatedPermissionAtOrga: EscalatedPermissionAtOrga = {
                orgaId: kontext.organisation.id,
                systemrechte: kontext.rolle.systemrechte.map((recht: RollenSystemRecht) => recht.name),
            };
            if (
                allEscalatedPermissions.some(
                    (perm: EscalatedPermissionAtOrga) =>
                        perm.orgaId === escalatedPermissionAtOrga.orgaId &&
                        perm.systemrechte === escalatedPermissionAtOrga.systemrechte,
                )
            ) {
                logger.debug(
                    `Skipping adding escalated permissions for orga ${escalatedPermissionAtOrga.orgaId} as it already exists in additionalEscalatedPermissions`,
                );
            } else {
                allEscalatedPermissions.push(escalatedPermissionAtOrga);
            }
        });

        return new EscalatedPersonPermissions(
            personPermissions.id,
            allEscalatedPermissions,
            organisationRepo,
            personenkontextRepo,
            logger,
        );
    }

    public static createNew(
        esacalator: { name: string },
        escalatedPermissions: Array<EscalatedPermissionAtOrga>,
        organisationRepo: OrganisationRepository,
        personenkontextRepo: DBiamPersonenkontextRepo,
        logger: ClassLogger,
    ): EscalatedPersonPermissions {
        return new EscalatedPersonPermissions(
            esacalator.name,
            escalatedPermissions,
            organisationRepo,
            personenkontextRepo,
            logger,
        );
    }

    //Make Working
    public async getOrgIdsWithSystemrecht(
        systemrechte: RollenSystemRecht[],
        withChildren: boolean = false,
        matchAll: boolean = true,
    ): Promise<PermittedOrgas> {
        if (await this.hasSystemrechteAtRootOrganisation(systemrechte, matchAll)) {
            return { all: true };
        }
        const organisationIDs: Set<OrganisationID> = new Set();
        for (const perm of this.escalatedPermissions) {
            if (perm.systemrechte === 'ALL') {
                organisationIDs.add(perm.orgaId);
            } else {
                const hasRequiredRechte: boolean = matchAll
                    ? systemrechte.every((recht: RollenSystemRecht) => perm.systemrechte.includes(recht.name))
                    : systemrechte.some((recht: RollenSystemRecht) => perm.systemrechte.includes(recht.name));
                if (hasRequiredRechte) {
                    organisationIDs.add(perm.orgaId);
                }
            }
        }

        if (withChildren) {
            const childOrgas: Organisation<true>[] = await this.organisationRepo.findChildOrgasForIds(
                Array.from(organisationIDs),
            );

            childOrgas.forEach((orga: Organisation<true>) => organisationIDs.add(orga.id));
        }

        return {
            all: false,
            orgaIds: Array.from(organisationIDs),
        };
    }

    public extendEscalation(additional: Array<EscalatedPermissionAtOrga>): void {
        for (const newPerm of additional) {
            const existing: EscalatedPermissionAtOrga | undefined = this.escalatedPermissions.find(
                (p: EscalatedPermissionAtOrga) => p.orgaId === newPerm.orgaId,
            );

            if (!existing) {
                this.logger.info(
                    `Extending escalation for ${this.id}: adding new orga ${newPerm.orgaId} with rights ${JSON.stringify(newPerm.systemrechte)}`,
                );
                this.escalatedPermissions.push(newPerm);
                continue;
            }

            if (existing.systemrechte === 'ALL') {
                this.logger.debug(`Skipping escalation for orga ${newPerm.orgaId}: already has ALL rights`);
                continue;
            }

            if (newPerm.systemrechte === 'ALL') {
                this.logger.info(`Extending escalation for ${this.id}: orga ${newPerm.orgaId} escalated to ALL rights`);
                existing.systemrechte = 'ALL';
                continue;
            }

            const before: RollenSystemRechtEnum[] = [...existing.systemrechte];
            const added: RollenSystemRechtEnum[] = newPerm.systemrechte.filter(
                (r: RollenSystemRechtEnum) => !existing.systemrechte.includes(r),
            );

            if (added.length > 0) {
                existing.systemrechte.push(...added);
                this.logger.info(
                    `Extending escalation for ${this.id}: orga ${newPerm.orgaId} added rights ${JSON.stringify(added)} (before: ${JSON.stringify(before)}, after: ${JSON.stringify(existing.systemrechte)})`,
                );
            } else {
                this.logger.debug(`Skipping escalation for orga ${newPerm.orgaId}: no new rights`);
            }
        }
    }

    public async hasSystemrechteAtOrganisation(
        organisationId: OrganisationID,
        systemrechte: RollenSystemRecht[],
        matchAll: boolean = true,
    ): Promise<boolean> {
        if (this.isHasAllEscalatedPermissionsOnRoot()) {
            return true;
        }

        if (this.isOrgaIdRoot(organisationId)) {
            const escalatedPermissionsOnRoot: EscalatedPermissionAtOrga | undefined = this.escalatedPermissions.find(
                (perm: EscalatedPermissionAtOrga) => perm.orgaId === 'ROOT' || perm.orgaId === this.getRootOrgaId(),
            );
            if (!escalatedPermissionsOnRoot) {
                return false;
            }

            return matchAll
                ? systemrechte.every((recht: RollenSystemRecht) =>
                      escalatedPermissionsOnRoot.systemrechte.includes(recht.name),
                  )
                : systemrechte.some((recht: RollenSystemRecht) =>
                      escalatedPermissionsOnRoot.systemrechte.includes(recht.name),
                  );
        } else {
            const parentOrgas: Organisation<true>[] = await this.organisationRepo.findParentOrgasForIds([
                organisationId,
            ]);
            const thisAndParentOrgaIds: OrganisationID[] = [
                parentOrgas.map((o: Organisation<true>) => o.id),
                organisationId,
            ].flat();

            const combindedRechteForThisAndParents: (RollenSystemRechtEnum | 'ALL')[] = thisAndParentOrgaIds
                .map((orgaId: OrganisationID) => {
                    const escalatedPermissionsAtOrga: EscalatedPermissionAtOrga | undefined =
                        this.escalatedPermissions.find((perm: EscalatedPermissionAtOrga) => perm.orgaId === orgaId);
                    return escalatedPermissionsAtOrga?.systemrechte ?? [];
                })
                .flat();
            if (combindedRechteForThisAndParents.includes('ALL')) {
                return true;
            }

            return matchAll
                ? systemrechte.every((recht: RollenSystemRecht) =>
                      combindedRechteForThisAndParents.includes(recht.name),
                  )
                : systemrechte.some((recht: RollenSystemRecht) =>
                      combindedRechteForThisAndParents.includes(recht.name),
                  );
        }
    }

    public async hasSystemrechteAtRootOrganisation(
        systemrechte: RollenSystemRecht[],
        matchAll: boolean = true,
    ): Promise<boolean> {
        return this.hasSystemrechteAtOrganisation(this.getRootOrgaId(), systemrechte, matchAll);
    }

    public async hasSystemrechtAtOrganisation(
        organisationId: OrganisationID,
        systemrecht: RollenSystemRecht,
    ): Promise<boolean> {
        return this.hasSystemrechteAtOrganisation(organisationId, [systemrecht], true);
    }

    //Make Working
    public async canModifyPerson(personId: PersonID): Promise<boolean> {
        const hasModifyRechtAtRoot: boolean = await this.hasSystemrechteAtRootOrganisation([
            RollenSystemRecht.PERSONEN_VERWALTEN,
        ]);

        if (hasModifyRechtAtRoot) {
            return true;
        }
        const orgaIdsForPerson: string[] = (await this.personenkontextRepo.findByPersonWithOrgaAndRolle(personId)).map(
            (pk: KontextWithOrgaAndRolle) => pk.organisation.id,
        );
        for (const orgaId of orgaIdsForPerson) {
            // Await in Loop used on purpose to have early returns and not check more orgaIds than necessary
            // eslint-disable-next-line no-await-in-loop
            if (await this.hasSystemrechtAtOrganisation(orgaId, RollenSystemRecht.PERSONEN_VERWALTEN)) {
                return true;
            }
        }
        return false;
    }

    public get personFields(): PersonFields {
        return this.cachedPersonFields;
    }

    //Make Working
    public async hasOrgVerwaltenRechtAtOrga(typ: OrganisationsTyp, administriertVon?: string): Promise<boolean> {
        if (typ === OrganisationsTyp.KLASSE) {
            const [oeffentlich]: [Organisation<true> | undefined, Organisation<true> | undefined] =
                await this.organisationRepo.findRootDirectChildren();
            return this.hasSystemrechtAtOrganisation(
                administriertVon ?? oeffentlich?.id ?? this.organisationRepo.ROOT_ORGANISATION_ID,
                RollenSystemRecht.KLASSEN_VERWALTEN,
            );
        } else if (typ === OrganisationsTyp.SCHULE) {
            return this.hasSystemrechteAtRootOrganisation([RollenSystemRecht.SCHULEN_VERWALTEN]);
        } else if (typ === OrganisationsTyp.TRAEGER) {
            return this.hasSystemrechteAtRootOrganisation([RollenSystemRecht.SCHULTRAEGER_VERWALTEN]);
        }
        return false;
    }

    private isOrgaIdRoot(organisationId: OrganisationID): boolean {
        return this.organisationRepo.ROOT_ORGANISATION_ID === organisationId;
    }

    private getRootOrgaId(): string {
        return this.organisationRepo.ROOT_ORGANISATION_ID;
    }

    private isHasAllEscalatedPermissionsOnRoot(): boolean {
        const escalatedPermissionsOnRoot: EscalatedPermissionAtOrga | undefined = this.escalatedPermissions.find(
            (perm: EscalatedPermissionAtOrga) => perm.orgaId === 'ROOT' || perm.orgaId === this.getRootOrgaId(),
        );
        return escalatedPermissionsOnRoot?.systemrechte === 'ALL';
    }
}
