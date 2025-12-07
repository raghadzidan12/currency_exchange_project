import { ApiProperty } from '@nestjs/swagger';
import { Contact } from '../entities/contact.entity';

export class ContactResponseDto {
  @ApiProperty({ type: Contact, description: 'Created contact message' })
  contact: Contact;

  @ApiProperty({ example: 'Thank you for contacting us! We will get back to you soon.' })
  message: string;
}

