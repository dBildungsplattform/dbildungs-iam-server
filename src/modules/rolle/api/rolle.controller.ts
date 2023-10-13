import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('rolle')
@Controller({ path: 'rolle' })
export class RolleController {}
