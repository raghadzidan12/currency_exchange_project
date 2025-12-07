import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminOnly } from '../decorators/admin-only.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import { CreateUserDto } from '../dtos/create-user.dto';
import { LoginResponseDto } from '../dtos/login-response.dto';
import { LoginDto } from '../dtos/login.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { PublicTestResponseDto } from '../dtos/public-test-response.dto';
import { User } from '../entities/user.entity';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { AuthGuard } from '../gurds/auth.guard';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { ObjectId } from 'typeorm';

@ApiTags('user')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Login user',
    operationId: 'loginUser',
  })
  @ApiOkResponse({
    type: LoginResponseDto,
    description: 'User logged in successfully',
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    // Validate user credentials
    const validatedUser = await this.userService.validateUser(
      null,
      loginDto.email,
      loginDto.password,
    );

    // Fetch the full user entity (without password) to ensure all fields are included
    const user = await this.userService.findOne(validatedUser._id);


    delete (user as any)?.password;

    // Generate access token
    const accessToken = await this.authService.generateAccessToken(user);

    return {
      user,
      accessToken,
      message: 'Login successful',
    };
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Get current logged-in user',
    operationId: 'getCurrentUser',
  })
  @ApiOkResponse({ type: User, description: 'Current user profile' })
  async getMe(@CurrentUser() user: User): Promise<User> {
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }
    return await this.userService.findOne(user._id);
  }

  @Public()
  @Get('public-test')
  @ApiOperation({ 
    summary: 'Public test endpoint (no auth required)',
    operationId: 'publicTest',
  })
  @ApiOkResponse({ 
    type: PublicTestResponseDto,
    description: 'Public endpoint test' 
  })
  publicTest(): PublicTestResponseDto {
    return {
      message: 'This is a public endpoint - no authentication required!',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Post()
  @ApiOperation({ 
    summary: 'Create a new user',
    operationId: 'createUser',
  })
  @ApiCreatedResponse({ type: User, description: 'User created successfully' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.userService.create(createUserDto);
  }

  @Get()
  @ApiBearerAuth()
  @AdminOnly()
  @ApiOperation({ 
    summary: 'Get all users',
    operationId: 'getAllUsers',
  })
  @ApiOkResponse({ type: [User], description: 'List of all users' })
  async findAll(): Promise<User[]> {
    return await this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get a user by ID',
    operationId: 'getUserById',
  })
  @ApiOkResponse({ type: User, description: 'User found' })
  async findOne(@Param('id') id: string): Promise<User> {
    return await this.userService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update a user',
    operationId: 'updateUser',
  })
  @ApiOkResponse({ type: User, description: 'User updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return await this.userService.update(id, updateUserDto);
  }

  @AdminOnly()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete a user (Admin only)',
    operationId: 'deleteUser',
  })
  @ApiNoContentResponse({ description: 'User deleted successfully' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.userService.remove(id);
  }
}
