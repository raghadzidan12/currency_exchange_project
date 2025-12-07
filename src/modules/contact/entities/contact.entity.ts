import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('contacts')
export class Contact {
  @ObjectIdColumn({ name: '_id' })
  @ApiProperty()
  _id: ObjectId;

  @Column()
  @ApiProperty({ example: 'John Doe', description: 'Contact name' })
  name: string;

  @Column()
  @ApiProperty({ example: 'john.doe@example.com', description: 'Contact email' })
  email: string;

  @Column()
  @ApiProperty({ example: 'Inquiry about exchange rates', description: 'Message subject' })
  subject: string;

  @Column('text')
  @ApiProperty({ example: 'I would like to know more about your exchange rates...', description: 'Message content' })
  message: string;

  @CreateDateColumn()
  @ApiProperty({ type: Date, description: 'Creation date of the contact message' })
  createdAt: Date;
}

