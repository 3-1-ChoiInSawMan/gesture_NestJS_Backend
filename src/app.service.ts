import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: '2026-1_capstone',
      version: '0.0.1',
      status: 'running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      node_version: process.version,
      environment: process.env.NODE_ENV ?? 'development',
    };
  }
}
