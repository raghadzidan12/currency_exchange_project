import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserService } from '../services/user.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private userService: UserService,

  ) {
    super({
      usernameField: 'email',
      passReqToCallback: true,
    });
  }

  validate(req, email: string, password: string) {
    if (password === '')
      throw new UnauthorizedException('Password is required');
    return this.userService.validateUser(req, email, password);
  }
}
