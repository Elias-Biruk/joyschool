import { IsArray, IsString } from 'class-validator';

export class ReorderModuleDto {
  @IsArray()
  @IsString({ each: true })
  moduleIds: string[];
}
