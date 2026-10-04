import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SlotResponseDto } from './dto/slot-response.dto';
import { SlotsService } from './slots.service';

@ApiTags('Slots')
@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @ApiOkResponse({
    description: 'List of available appointment slots.',
    type: SlotResponseDto,
    isArray: true,
  })
  @Get()
  findAvailableSlots() {
    return this.slotsService.findAvailableSlots();
  }
}
