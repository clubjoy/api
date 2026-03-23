import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, IsUrl } from 'class-validator';

export class CreateHostApplicationDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiProperty({ example: 'My Workshop Company', required: false })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty({ example: '12345' })
  @IsString()
  @MinLength(1)
  postalCode: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+39 123 456 7890' })
  @IsString()
  @MinLength(1)
  phone: string;

  @ApiProperty({ example: 'https://www.myworkshop.com', required: false })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiProperty({ example: 'We offer pottery workshops, painting classes, and craft sessions for all ages.' })
  @IsString()
  @MinLength(10)
  workshopsOffered: string;

  @ApiProperty({ example: 'Monday to Friday, 9:00 AM - 5:00 PM. Weekends by appointment.' })
  @IsString()
  @MinLength(10)
  daysAndHours: string;

  @ApiProperty({ example: 'en', default: 'en' })
  @IsString()
  @IsOptional()
  locale?: string;
}
