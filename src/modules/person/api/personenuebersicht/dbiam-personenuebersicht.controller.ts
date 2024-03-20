import { Controller, Get, Param, Query, UseFilters } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SchulConnexValidationErrorFilter } from '../../../../shared/error/schulconnex-validation-error.filter.js';
import { DBiamPersonenuebersichtResponse } from './dbiam-personenuebersicht.response.js';
import { DBiamFindPersonenuebersichtByPersonIdParams } from './dbiam-find-personenuebersicht-by-personid.params.js';
import { Person } from '../../domain/person.js';
import { PersonRepository } from '../../persistence/person.repository.js';
import { EntityNotFoundError } from '../../../../shared/error/entity-not-found.error.js';
import { SchulConnexErrorMapper } from '../../../../shared/error/schul-connex-error.mapper.js';
import { DBiamPersonenzuordnungResponse } from './dbiam-personenzuordnung.response.js';
import { Personenkontext } from '../../../personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextRepo } from '../../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RolleRepo } from '../../../rolle/repo/rolle.repo.js';
import { OrganisationID, RolleID } from '../../../../shared/types/aggregate-ids.types.js';
import { Rolle } from '../../../rolle/domain/rolle.js';
import { OrganisationRepo } from '../../../organisation/persistence/organisation.repo.js';
import { OrganisationDo } from '../../../organisation/domain/organisation.do.js';
import { PagedResponse } from '../../../../shared/paging/index.js';
import { PersonenuebersichtQueryParams } from './personenuebersicht-query.params.js';

@UseFilters(SchulConnexValidationErrorFilter)
@ApiTags('dbiam-personenuebersicht')
@ApiBearerAuth()
@Controller({ path: 'dbiam/personenuebersicht' })
export class DBiamPersonenuebersichtController {
    public constructor(
        private readonly personRepository: PersonRepository,
        private readonly dbiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly rolleRepository: RolleRepo,
        private readonly organisationRepository: OrganisationRepo,
    ) {}

    @Get('')
    @ApiOkResponse({
        description: 'The personenuebersichten were successfully returned.',
        type: [PagedResponse<DBiamPersonenuebersichtResponse>],
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get personenuebersichten.' })
    @ApiForbiddenResponse({ description: 'Insufficient permission to get personenuebersichten.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting personenuebersichten.' })
    public findPersonenuebersichten(
        @Query() queryParams: PersonenuebersichtQueryParams,
    ): PagedResponse<DBiamPersonenuebersichtResponse> {
        const items: DBiamPersonenuebersichtResponse[] = [];
        const total: number = 0;

        return {
            items,
            offset: queryParams.offset ?? 0,
            limit: queryParams.limit ?? 0,
            total,
        };
    }

    @Get(':personId')
    @ApiOkResponse({
        description: 'The personenuebersicht was successfully returned.',
        type: [DBiamPersonenuebersichtResponse],
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get personenuebersicht.' })
    @ApiForbiddenResponse({ description: 'Insufficient permission to get personenuebersicht.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting personenuebersicht.' })
    public async findPersonenuebersichtenByPerson(
        @Param() params: DBiamFindPersonenuebersichtByPersonIdParams,
    ): Promise<DBiamPersonenuebersichtResponse> {
        const person: Option<Person<true>> = await this.personRepository.findById(params.personId);
        if (!person) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityNotFoundError('Person', params.personId),
                ),
            );
        }

        const personenUebersichten: DBiamPersonenzuordnungResponse[] = [];
        const personenKontexte: Personenkontext<true>[] = await this.dbiamPersonenkontextRepo.findByPerson(
            params.personId,
        );
        const rollenIdsForKontexte: RolleID[] = personenKontexte.map(
            (kontext: Personenkontext<true>) => kontext.rolleId,
        );
        const organisationIdsForKontexte: OrganisationID[] = personenKontexte.map(
            (kontext: Personenkontext<true>) => kontext.organisationId,
        );
        const rollenForKontexte: Map<string, Rolle<true>> = await this.rolleRepository.findByIds(rollenIdsForKontexte);
        const organisationsForKontexte: Map<string, OrganisationDo<true>> = await this.organisationRepository.findByIds(
            organisationIdsForKontexte,
        ); //use Organisation Aggregate as soon as there is one

        personenKontexte.forEach((pk: Personenkontext<true>) => {
            const rolle: Rolle<true> | undefined = rollenForKontexte.get(pk.rolleId);
            const organisation: OrganisationDo<true> | undefined = organisationsForKontexte.get(pk.organisationId);
            if (!rolle) {
                throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                    SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                        new EntityNotFoundError('Rolle', pk.rolleId),
                    ),
                );
            }
            if (!organisation) {
                throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                    SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                        new EntityNotFoundError('Organisation', pk.organisationId),
                    ),
                );
            }
            personenUebersichten.push(new DBiamPersonenzuordnungResponse(pk, organisation, rolle));
        });

        return new DBiamPersonenuebersichtResponse(person, personenUebersichten);
    }
}
