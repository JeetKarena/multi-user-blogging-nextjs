// scripts/cleanup-expired-registrations.ts
import { db } from '../src/lib/db';
import { pendingRegistrations } from '../src/lib/db/schema';
import { lt } from 'drizzle-orm';

async function cleanupExpiredRegistrations() {
  try {
    console.log('🧹 Starting cleanup of expired pending registrations...');

    // Delete all pending registrations where otp_expires_at < now
    const deletedRegistrations = await db
      .delete(pendingRegistrations)
      .where(lt(pendingRegistrations.otpExpiresAt, new Date()))
      .returning({ id: pendingRegistrations.id });

    console.log(`✅ Successfully cleaned up expired pending registrations`);
    console.log(`🗑️  Removed ${deletedRegistrations.length} expired records`);
    console.log(`📊 Cleanup completed at: ${new Date().toISOString()}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupExpiredRegistrations();