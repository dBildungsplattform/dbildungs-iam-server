import { Controller, Get } from '@nestjs/common';
import { RolleService } from '../domain/rolle.service.js';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('rolle')
@Controller({ path: 'rolle' })
export class RolleController {
    public constructor(private readonly rolleService: RolleService) {}

    @Get()
    public async getPersonRollenZuweisungById(): Promise<void> {
        await this.rolleService.getRolleBerechtigungsZuweisungByPersonId('1');
    }
}
