import { IsNotEmpty, IsString } from 'class-validator'

export class CreateFlowDto {
  @IsNotEmpty()
  @IsString()
  name: string
}
