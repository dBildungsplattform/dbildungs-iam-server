import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../authentication/api/public.decorator.js';
import { VidisApiService } from '../domain/vidis.api-service.js';
import { VidisAngebotWithSchoolActivations, VidisServiceResponseAngebot } from './vidis-angebote-api.types.js';

@ApiTags('vidis-test')
@Controller({ path: 'vidis-test' })
export class VidisTestController {
    public constructor(private readonly vidisApiService: VidisApiService) {}

    @Get('by-region')
    @Public()
    @ApiOperation({ summary: 'Get activated Angebote by region.' })
    public async getActivatedAngeboteByRegion(): Promise<VidisAngebotWithSchoolActivations[]> {
        const res: Result<VidisAngebotWithSchoolActivations[]> =
            await this.vidisApiService.getActivatedAngeboteByRegionSH();
        if (res.ok) {
            return res.value;
        }
        return [];
    }

    @Get('by-school')
    @Public()
    @ApiOperation({ summary: 'Get activated Angebote by school.' })
    @ApiQuery({ name: 'kennung', type: String })
    public async getActivatedAngeboteBySchool(
        @Query('kennung') kennung: string,
    ): Promise<VidisServiceResponseAngebot[]> {
        const res: Result<VidisServiceResponseAngebot[]> =
            await this.vidisApiService.getActivatedAngeboteBySchool(kennung);
        if (res.ok) {
            return res.value;
        }
        return [];
    }
}
