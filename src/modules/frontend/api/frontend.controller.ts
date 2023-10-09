import { Controller, Post } from '@nestjs/common';
import { ApiAcceptedResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, Public, Resource } from 'nest-keycloak-connect';

@ApiTags('frontend')
@Controller({ path: 'frontend' })
export class FrontendController {
    // Endpoints decorated with @Public are accessible to everyone
    @Public()
    @Resource('test')
    @Post('login')
    @ApiAcceptedResponse({ description: 'The person was successfully logged in.' })
    public login(): string {
        return 'Login!';
    }

    // Endpoints without @Public decorator automatically verify user
    @Post('logout')
    @ApiAcceptedResponse({ description: 'The person was successfully logged out.' })
    public logout(@AuthenticatedUser() user: unknown): string {
        // Can get logged in user with @AuthenticatedUser (technically any-type, is the JSON response from keycloak)
        return `Logout! ${JSON.stringify(user)}`;
    }
}
