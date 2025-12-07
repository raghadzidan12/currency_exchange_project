import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Contact } from './entities/contact.entity';
import { CreateContactDto } from './dtos/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
  ) {}

  async create(createContactDto: CreateContactDto): Promise<Contact> {
    const contact = this.contactRepository.create({
      ...createContactDto,
      email: createContactDto.email.toLowerCase(),
    });

    return await this.contactRepository.save(contact);
  }

  async findAll(): Promise<Contact[]> {
    return await this.contactRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(_id: string | ObjectId): Promise<Contact> {
    const objectId = _id instanceof ObjectId ? _id : new ObjectId(_id);
    
    const contact = await this.contactRepository.findOne({
      where: { _id: objectId } as any,
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${_id} not found`);
    }

    return contact;
  }

  async remove(_id: string | ObjectId): Promise<void> {
    const contact = await this.findOne(_id);
    await this.contactRepository.remove(contact);
  }
}

