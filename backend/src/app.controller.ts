import { Controller, Get, SetMetadata } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IS_PUBLIC_KEY } from '@core/guards/jwt-auth.guard';

@ApiTags('Health')
@Controller('health')
export class AppController {
  @Get()
  @SetMetadata(IS_PUBLIC_KEY, true)
  @ApiOperation({ summary: 'Performs systemic connectivity health check.' })
  checkHealth() {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
    };
  }
}
