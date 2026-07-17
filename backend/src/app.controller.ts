import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Performs systemic connectivity health check.' })
  checkHealth() {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
    };
  }
}
