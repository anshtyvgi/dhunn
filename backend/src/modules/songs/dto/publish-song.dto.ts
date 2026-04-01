import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class PublishSongDto {
  @IsString()
  songId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string;
}
