import { User } from './user.js';
import { UsernameGeneratorService } from './username-generator.service.js';

export class UserFactory {
    public constructor(private usernameGenerator: UsernameGeneratorService) {}

    public async newUser(firstname: string, lastname: string): Promise<User> {
        const generatedUsername: string = await this.usernameGenerator.generateUsername(firstname, lastname);
        return new User('', generatedUsername, '');
    }
}
