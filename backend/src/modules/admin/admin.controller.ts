import { Controller, Delete, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AdminService } from './admin.service';

// Auth is handled by the frontend admin route (checks ADMIN_USER_IDS).
// This controller is behind the Clerk auth guard already.
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async dashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  async users() {
    return this.adminService.getUsers();
  }

  @Get('sessions')
  async sessions(@Query('limit') limit?: string) {
    return this.adminService.getSessions(
      limit ? Math.min(parseInt(limit, 10), 100) : 20,
    );
  }

  @Get('transactions')
  async transactions(@Query('limit') limit?: string) {
    return this.adminService.getTransactions(
      limit ? Math.min(parseInt(limit, 10), 100) : 50,
    );
  }

  @Public()
  @Delete('clear-data')
  async clearData(@Query('token') token?: string) {
    // Simple token check — use PAYMENTS_WEBHOOK_SECRET as the admin token
    const secret = process.env.PAYMENTS_WEBHOOK_SECRET;
    if (!secret || token !== secret) {
      return { error: 'Unauthorized' };
    }
    return this.adminService.clearAllData();
  }
}
