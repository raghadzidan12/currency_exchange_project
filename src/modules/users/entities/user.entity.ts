import { ApiProperty } from '@nestjs/swagger';
import bcrypt from 'bcrypt';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ObjectIdColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectId } from 'mongodb';
import { UserRole } from '../constants';

@Entity()
export class User {
  @ObjectIdColumn({ name: '_id' })
  @ApiProperty()
  _id: ObjectId;

  @Column()
  @ApiProperty()
  firstName: string;

  @Column()
  @ApiProperty()
  lastName: string;

  @Column()
  @ApiProperty()
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  @ApiProperty({ enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn()
  @ApiProperty({ type: Date, description: 'Creation date of the user' })
  createdAt?: Date;

  @UpdateDateColumn({})
  @ApiProperty({ type: Date, description: 'Last update date of the user' })
  updatedAt?: Date;

  @BeforeInsert()
  async beforeInsert() {
    this.password = await bcrypt.hash(this.password, 10);
    this.email = this.email.toLowerCase();
  }
}
