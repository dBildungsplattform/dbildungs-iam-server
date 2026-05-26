import { Injectable } from '@nestjs/common';

import { ClassLogger } from '../../../core/logging/class-logger.js';
import { VidisApiService } from './vidis.api-service.js';
import type { VidisDomainError } from './vidis-domain.error.js';
import type {
	VidisAngebotWithSchoolActivations,
	VidisServiceResponseSchoolActivation,
	VidisServiceResponseAngebot,
} from './vidis.types.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { OrganisationScope } from '../../organisation/persistence/organisation.scope.js';
import { RollenerweiterungRepo } from '../../rolle/repo/rollenerweiterung.repo.js';

type VidisSchoolActivatedAngebot = {
	angebot: VidisServiceResponseAngebot;
	date: string;
};

const SCHOOLS_PAGE_SIZE: number = 100;

type VidisAngeboteByOrganisationId = Record<string, VidisSchoolActivatedAngebot[]>;
type VidisOrganisationIdByKennung = Record<string, string>;

@Injectable()
export class VidisSyncService {


	public constructor(
		private readonly vidisApiService: VidisApiService,
		private readonly organisationRepo: OrganisationRepository,
		private readonly rollenerweiterungRepo: RollenerweiterungRepo,
		private readonly logger: ClassLogger,
	) {}

	public async sync(): Promise<void> {
		const activatedAngebote: Result<VidisAngebotWithSchoolActivations[], VidisDomainError> =
			await this.vidisApiService.getActivatedAngeboteByRegionSH();

		if (!activatedAngebote.ok) {
			this.logger.debug('Skipping VIDIS sync because loading activated Angebote failed');
			return;
		}

		await this.syncSchoolsPage(activatedAngebote.value, 0);
	}

	private syncForSchoolInternal(
		organisationId: string,
		vidisAngeboteForSchool: VidisSchoolActivatedAngebot[],
	): Promise<void> {


		void organisationId;
		void vidisAngeboteForSchool;

		return Promise.resolve();
	}

	private mapOrganisationIdsByKennung(schools: Organisation<true>[]): VidisOrganisationIdByKennung {
		return schools.reduce(
			(organisationIdByKennung: VidisOrganisationIdByKennung, school: Organisation<true>) => {
				if (school.kennung) {
					organisationIdByKennung[school.kennung] = school.id;
				}

				return organisationIdByKennung;
			},
			{},
		);
	}

	private async syncSchoolsPage(
		activatedAngebote: VidisAngebotWithSchoolActivations[],
		schoolOffset: number,
	): Promise<void> {
		const [schools, total]: Counted<Organisation<true>> = await this.organisationRepo.findBy(
			new OrganisationScope().findBy({
				typ: 'SCHULE',
			}).paged(schoolOffset, SCHOOLS_PAGE_SIZE),
		);

		if (schools.length === 0) {
			return;
		}


		const organisationIdByKennung: VidisOrganisationIdByKennung = this.mapOrganisationIdsByKennung(schools);
		const angeboteByOrganisationId: VidisAngeboteByOrganisationId = this.groupAngeboteByOrganisationId(
			activatedAngebote,
			organisationIdByKennung,
		);

		await Promise.all(
			Object.keys(angeboteByOrganisationId).map((organisationId: string) => {
				const angebote: VidisSchoolActivatedAngebot[] = angeboteByOrganisationId[organisationId] ?? [];
				return this.syncForSchoolInternal(organisationId, angebote);
			}),
		);

		const nextSchoolOffset: number = schoolOffset + SCHOOLS_PAGE_SIZE;
		if (nextSchoolOffset >= total) {
			return;
		}

		return this.syncSchoolsPage(activatedAngebote, nextSchoolOffset);
	}

	private groupAngeboteByOrganisationId(
		activatedAngebote: VidisAngebotWithSchoolActivations[],
		organisationIdByKennung: VidisOrganisationIdByKennung,
	): VidisAngeboteByOrganisationId {
		const angeboteByOrganisationId: VidisAngeboteByOrganisationId = {};

		activatedAngebote.forEach((angebotWithSchoolActivations: VidisAngebotWithSchoolActivations) => {
			angebotWithSchoolActivations.schoolActivations.forEach(
				(schoolActivation: VidisServiceResponseSchoolActivation) => {
				const organisationId: string | undefined = organisationIdByKennung[schoolActivation.kennung];
				if (!organisationId) {
					return;
				}

				const schoolAngebote: VidisSchoolActivatedAngebot[] =
					angeboteByOrganisationId[organisationId] ?? [];

				schoolAngebote.push({
					angebot: angebotWithSchoolActivations.angebot,
					date: schoolActivation.date,
				});

				angeboteByOrganisationId[organisationId] = schoolAngebote;
				},
			);
		});

		return angeboteByOrganisationId;
	}
}
