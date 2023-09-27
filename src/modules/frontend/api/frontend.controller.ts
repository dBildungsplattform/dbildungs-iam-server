import { Controller, Post } from '@nestjs/common';
import { ApiAcceptedResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('frontend')
@Controller({ path: 'frontend' })
export class FrontendController {
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
