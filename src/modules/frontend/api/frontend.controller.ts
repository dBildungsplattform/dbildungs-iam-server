import { Controller, Get, Post } from '@nestjs/common';
import { ApiAcceptedResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, Public } from 'nest-keycloak-connect';

@ApiTags('frontend')
@Controller({ path: 'frontend' })
export class FrontendController {
    @Get('public')
    @Public()
    public publicMethod(): string {
        return 'Everyone can access @Public endpoints.';
    }

    @Get('me')
    public me(@AuthenticatedUser() user: unknown): string {
        return JSON.stringify(user);
    }

    @Public()
    @Post('login')
    @ApiAcceptedResponse({ description: 'The person was successfully logged in.' })
    public login(): string {
        return 'Login!';
    }

    @Post('logout')
    @ApiAcceptedResponse({ description: 'The person was successfully logged out.' })
    public logout(): string {
        return 'Logout!';
    }
}
