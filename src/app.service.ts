import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(' ');
  }

  public getInfo() {
    const uptime = Math.floor(process.uptime());
    return {
      name: '2026-1_capstone',
      version: '0.0.1',
      status: 'running',
      timestamp: new Date().toISOString(),
      uptime,
      uptimeHuman: this.formatUptime(uptime),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV ?? 'development',
    };
  }
}
