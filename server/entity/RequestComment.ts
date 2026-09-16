import { DbAwareColumn, resolveDbType } from '@server/utils/DbColumnHelper';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MediaRequest } from './MediaRequest';
import { User } from './User';

@Entity()
class RequestComment {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => User, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @Index()
  public user: User;

  @ManyToOne(() => MediaRequest, (request) => request.comments, {
    onDelete: 'CASCADE',
  })
  @Index()
  public request: MediaRequest;

  @Column({ type: 'text' })
  public message: string;

  @DbAwareColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt: Date;

  @UpdateDateColumn({
    type: resolveDbType('datetime'),
    default: () => 'CURRENT_TIMESTAMP',
  })
  public updatedAt: Date;

  constructor(init?: Partial<RequestComment>) {
    Object.assign(this, init);
  }
}

export default RequestComment;
