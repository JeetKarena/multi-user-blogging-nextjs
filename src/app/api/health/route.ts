// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Check database connectivity
    await db.execute('SELECT 1');

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.version,
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      services: {
        database: 'operational',
        api: 'operational'
      }
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);

    const errorStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.version,
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      services: {
        database: 'error',
        api: 'operational'
      },
      error: 'Database connection failed'
    };

    return NextResponse.json(errorStatus, { status: 503 });
  }
}