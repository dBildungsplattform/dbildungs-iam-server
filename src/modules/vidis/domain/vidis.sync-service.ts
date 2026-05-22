import { Injectable } from '@nestjs/common';

import { ClassLogger } from '../../../core/logging/class-logger.js';
import { VidisApiService } from './vidis.api-service.js';
import type { VidisDomainError } from './vidis-domain.error.js';
import type {
	VidisAngebotWithSchoolActivations,
	VidisServiceResponseSchoolActivation,
	VidisServiceResponseAngebot,
} from './vidis.types.js';

type VidisSchoolActivatedAngebot = {
	angebot: VidisServiceResponseAngebot;
	date: string;
};

type VidisAngeboteBySchool = Record<string, VidisSchoolActivatedAngebot[]>;

@Injectable()
export class VidisSyncService {
	public constructor(
		private readonly vidisApiService: VidisApiService,
		private readonly logger: ClassLogger,
	) {}

	public async sync(): Promise<void> {
		const activatedAngebote: Result<VidisAngebotWithSchoolActivations[], VidisDomainError> =
			await this.vidisApiService.getActivatedAngeboteByRegionSH();

		if (!activatedAngebote.ok) {
			this.logger.debug('Skipping VIDIS sync because loading activated Angebote failed');
			return;
		}

		const angeboteBySchool: VidisAngeboteBySchool = this.groupAngeboteBySchool(activatedAngebote.value);

		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		Object.keys(angeboteBySchool).forEach(async (kennung: string) => {
			const angebote: VidisSchoolActivatedAngebot[] = angeboteBySchool[kennung] ?? [];
            void await this.syncForSchool(angebote);
		});
	}

    public async syncForSchool(angeboteForSchool: VidisSchoolActivatedAngebot[]): Promise<void> {
        return;
    }

	private groupAngeboteBySchool(
		activatedAngebote: VidisAngebotWithSchoolActivations[],
	): VidisAngeboteBySchool {
		const angeboteBySchool: VidisAngeboteBySchool = {};

		activatedAngebote.forEach((angebotWithSchoolActivations: VidisAngebotWithSchoolActivations) => {
			angebotWithSchoolActivations.schoolActivations.forEach(
				(schoolActivation: VidisServiceResponseSchoolActivation) => {
				const schoolAngebote: VidisSchoolActivatedAngebot[] =
					angeboteBySchool[schoolActivation.kennung] ?? [];

				schoolAngebote.push({
					angebot: angebotWithSchoolActivations.angebot,
					date: schoolActivation.date,
				});

				angeboteBySchool[schoolActivation.kennung] = schoolAngebote;
				},
			);
		});

		return angeboteBySchool;
	}
}
