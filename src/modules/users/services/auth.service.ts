import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { UserRole } from '../constants';

export interface JwtPayload {
  sub: string; // Store as string for JWT (ObjectId serialized as string)
  email: string;
  role: string;
}

export interface UserPayload {
  _id: string | any;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(user: User | UserPayload): Promise<string> {
    const payload: JwtPayload = {
      sub: user._id.toString(), // Convert ObjectId to string for JWT
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
