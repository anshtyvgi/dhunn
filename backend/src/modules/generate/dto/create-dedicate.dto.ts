import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum Occasion {
  BIRTHDAY = 'birthday',
  ANNIVERSARY = 'anniversary',
  LOVE = 'love',
  APOLOGY = 'apology',
  THANK_YOU = 'thank-you',
  FRIENDSHIP = 'friendship',
  FAREWELL = 'farewell',
  CUSTOM = 'custom',
}

export enum Relationship {
  PARTNER = 'partner',
  PARENT = 'parent',
  FRIEND = 'friend',
  SIBLING = 'sibling',
  COLLEAGUE = 'colleague',
  CRUSH = 'crush',
  CUSTOM = 'custom',
}

export enum Mood {
  HAPPY = 'happy',
  ROMANTIC = 'romantic',
  NOSTALGIC = 'nostalgic',
  ENERGETIC = 'energetic',
  BITTERSWEET = 'bittersweet',
  PLAYFUL = 'playful',
  SAVAGE = 'savage',
}

export enum Genre {
  BOLLYWOOD = 'bollywood',
  POP = 'pop',
  LOFI = 'lofi',
  CLASSICAL = 'classical',
  RNB = 'rnb',
  HIPHOP = 'hiphop',
  ACOUSTIC = 'acoustic',
}

export enum Language {
  HINDI = 'hindi',
  ENGLISH = 'english',
  HINGLISH = 'hinglish',
  PUNJABI = 'punjabi',
}

export enum VoiceType {
  MALE = 'male',
  FEMALE = 'female',
  DUET = 'duet',
}

export class LyricPreviewOptionDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsString()
  @MaxLength(120)
  vibe!: string;

  @IsString()
  @MaxLength(5000)
  lyrics!: string;

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  tags!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverPrompt?: string;
}

export class CreateDedicateDto {
  @IsString()
  @MaxLength(120)
  recipientName!: string;

  @IsEnum(Occasion)
  occasion!: Occasion;

  @IsEnum(Relationship)
  relationship!: Relationship;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @IsEnum(Mood)
  mood!: Mood;

  @IsEnum(Genre)
  genre!: Genre;

  @IsEnum(Language)
  language!: Language;

  @IsEnum(VoiceType)
  voice!: VoiceType;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => LyricPreviewOptionDto)
  lyricOptions?: LyricPreviewOptionDto[];
}
