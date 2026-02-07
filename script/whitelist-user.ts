/**
 * Whitelist Script: Grant premium subscription to test user
 * Usage: npx tsx script/whitelist-user.ts <email>
 */

import 'dotenv/config';
import { db } from '../server/db';
import { users, subscriptions, subscriptionPlans } from '../shared/schema';
import { eq, desc } from 'drizzle-orm';

async function whitelistUser(email: string) {
  console.log(`🔍 Looking for user: ${email}`);
  
  // Find user by email
  const allUsers = await db.select().from(users).where(eq(users.email, email));
  const user = allUsers[0];
  
  if (!user) {
    console.error(`❌ User with email "${email}" not found`);
    process.exit(1);
  }
  
  console.log(`✓ Found user: ${user.name || user.email} (${user.email})`);
  
  // Get monthly plan (or create if not exists)
  const allPlans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.name, 'Monthly'));
  let plan = allPlans[0];
  
  if (!plan) {
    console.log(`📋 Creating Monthly plan...`);
    const newPlans = await db
      .insert(subscriptionPlans)
      .values({
        name: 'Monthly',
        price: 49000,
        durationDays: 30,
        description: 'Premium monthly subscription',
        isActive: true,
      })
      .returning();
    plan = newPlans[0];
  }
  
  // Create subscription (1 year for testing)
  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1); // 1 year from now
  
  const newSubs = await db
    .insert(subscriptions)
    .values({
      userId: user.id,
      planId: plan.id,
      startDate,
      endDate,
      status: 'active',
      paymentTransactionId: 'WHITELIST-TEST',
    })
    .returning();
  const subscription = newSubs[0];
  
  console.log(`\n✅ SUCCESS! User whitelisted with premium subscription`);
  console.log(`   User: ${user.name || user.email}`);
  console.log(`   Plan: ${plan.name}`);
  console.log(`   Start: ${startDate.toISOString().split('T')[0]}`);
  console.log(`   End: ${endDate.toISOString().split('T')[0]}`);
  console.log(`   Status: ${subscription.status}`);
  console.log(`\n🎉 User can now access all premium features!`);
  
  process.exit(0);
}

// Get email from command line
const email = process.argv[2] || 'ugadimas25@gmail.com';

whitelistUser(email).catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
