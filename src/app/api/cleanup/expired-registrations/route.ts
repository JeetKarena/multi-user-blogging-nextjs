// src/app/api/cleanup/expired-registrations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pendingRegistrations } from '@/lib/db/schema';
import { lt } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check for security
    // You can add an API key check here if needed
    const authHeader = request.headers.get('authorization');
    const expectedApiKey = process.env.CLEANUP_API_KEY;

    if (expectedApiKey && authHeader !== `Bearer ${expectedApiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🧹 Starting cleanup of expired pending registrations via API...');

    // Delete all pending registrations where otp_expires_at < now
    await db
      .delete(pendingRegistrations)
      .where(lt(pendingRegistrations.otpExpiresAt, new Date()));

    const cleanupTime = new Date().toISOString();

    console.log(`✅ Successfully cleaned up expired pending registrations at ${cleanupTime}`);

    return NextResponse.json({
      success: true,
      message: 'Expired pending registrations cleaned up successfully',
      timestamp: cleanupTime,
    });

  } catch (error) {
    console.error('❌ Error during cleanup:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cleanup expired registrations',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Also allow GET for easier testing/manual runs
export async function GET(request: NextRequest) {
  return POST(request);
}