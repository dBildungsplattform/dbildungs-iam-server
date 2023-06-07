import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller('dummy')
export class AppController {
    public constructor(private readonly appService: AppService) {}

    @Get()
    public getHello(): string {
        return this.appService.getHello();
    }
}
