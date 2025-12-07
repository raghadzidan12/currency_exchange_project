import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { Contact } from './entities/contact.entity';
import { CreateContactDto } from './dtos/create-contact.dto';
import { ContactResponseDto } from './dtos/contact-response.dto';
import { Public } from '../users/decorators/public.decorator';
import { AdminOnly } from '../users/decorators/admin-only.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Submit a contact form (Public)',
    description: 'Submit a contact message. No authentication required.',
    operationId: 'createContact',
  })
  @ApiCreatedResponse({
    type: ContactResponseDto,
    description: 'Contact message submitted successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid input or validation error' })
  async create(@Body() createContactDto: CreateContactDto): Promise<ContactResponseDto> {
    const contact = await this.contactService.create(createContactDto);
    return {
      contact,
      message: 'Thank you for contacting us! We will get back to you soon.',
    };
  }

  @AdminOnly()
  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all contact messages (Admin only)',
    description: 'Retrieve all contact messages. Admin access required.',
    operationId: 'getAllContacts',
  })
  @ApiOkResponse({
    type: [Contact],
    description: 'List of all contact messages',
  })
  async findAll(): Promise<Contact[]> {
    return await this.contactService.findAll();
  }

  @AdminOnly()
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a contact message by ID (Admin only)',
    description: 'Retrieve a specific contact message by its ID. Admin access required.',
    operationId: 'getContactById',
  })
  @ApiOkResponse({
    type: Contact,
    description: 'Contact message details',
  })
  @ApiNotFoundResponse({ description: 'Contact message not found' })
  async findOne(@Param('id') id: string): Promise<Contact> {
    return await this.contactService.findOne(id);
  }

  @AdminOnly()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a contact message (Admin only)',
    description: 'Delete a contact message by its ID. Admin access required.',
    operationId: 'deleteContact',
  })
  @ApiNoContentResponse({ description: 'Contact message deleted successfully' })
  @ApiNotFoundResponse({ description: 'Contact message not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.contactService.remove(id);
  }
}

