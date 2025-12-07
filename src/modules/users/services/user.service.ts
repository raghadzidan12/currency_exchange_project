import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { User } from '../entities/user.entity';
import { compare } from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      select: [
        '_id',
        'firstName',
        'lastName',
        'email',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async findOne(_id: string | ObjectId): Promise<User> {
    // Convert string ID to ObjectId for MongoDB
    const objectId = _id instanceof ObjectId ? _id : new ObjectId(_id);
    
    const user = await this.userRepository.findOne({
      where: { _id: objectId } as any,
      select: [
        '_id',
        'firstName',
        'lastName',
        'email',
        'createdAt',
        'updatedAt',
        'role'
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${_id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      select: [
        '_id',
        'firstName',
        'lastName',
        'email',
        'createdAt',
        'updatedAt',
        'role',
        'password',
      ],
    });
  }

  async update(_id: string | ObjectId, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(_id);

    // Check if email is being updated and if it's already taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
      updateUserDto.email = updateUserDto.email.toLowerCase();
    }

    // Hash password if it's being updated
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(_id: string | ObjectId): Promise<void> {
    const user = await this.findOne(_id);
    await this.userRepository.remove(user);
  }

  async validateUser(req, email: string, password: string) {
    const user = await this.findByEmail(email);

    console.log('user', user);
    if (!user) throw new UnauthorizedException('User not found');
    console.log('user', user);


    const isPasswordMatch = await compare(password, user.password);

    console.log('isPasswordMatch', isPasswordMatch, {
      password,
      userPassword: user.password,
    });

    if (!isPasswordMatch)
      throw new UnauthorizedException('Invalid credentials');


    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }
}
