import { Controller, Delete, Get, Query } from '@nestjs/common';
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

  @Delete('clear-data')
  async clearData() {
    return this.adminService.clearAllData();
  }
}
