import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { EntityCouldNotBeCreated } from '../../../shared/error/index.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { DBiamCreatePersonenkontextBodyParams } from './dbiam-create-personenkontext.body.params.js';
import { DBiamPersonenkontextRepo } from './dbiam-personenkontext.repo.js';
import { DBiamPersonenkontextResponse } from './dbiam-personenkontext.response.js';
import { DBiamFindPersonenkontexteByPersonIdParams } from './dbiam-find-personenkontext-by-personid.params.js';

@ApiTags('dbiam-personenkontexte')
@ApiBearerAuth()
@Controller({ path: 'dbiam/personenkontext' }) // Singular/Plural?
export class DBiamPersonenkontextController {
    public constructor(private readonly repo: DBiamPersonenkontextRepo) {}

    @Get(':personId')
    @ApiOkResponse({
        description: 'Test',
        type: [DBiamPersonenkontextResponse],
    })
    public async findPersonenkontextsByPerson(
        @Param() params: DBiamFindPersonenkontexteByPersonIdParams,
    ): Promise<DBiamPersonenkontextResponse[]> {
        const personenkontexte: Personenkontext<true>[] = await this.repo.findByPerson(params.personId);

        const response: DBiamPersonenkontextResponse[] = personenkontexte.map(
            (k: Personenkontext<true>) => new DBiamPersonenkontextResponse(k),
        );

        return response;
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        description: 'Test',
        type: DBiamPersonenkontextResponse,
    })
    public async createPersonenkontext(
        @Body() params: DBiamCreatePersonenkontextBodyParams,
    ): Promise<DBiamPersonenkontextResponse> {
        const exists: boolean = await this.repo.exists(params.personId, params.organisationId, params.rolleId);

        if (exists) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new EntityCouldNotBeCreated('Personenkontext')),
            );
        }

        const newPersonenkontext: Personenkontext<false> = Personenkontext.createNew(
            params.personId,
            params.organisationId,
            params.rolleId,
        );

        const savedPersonenkontext: Personenkontext<true> = await this.repo.save(newPersonenkontext);

        return new DBiamPersonenkontextResponse(savedPersonenkontext);
    }
}
