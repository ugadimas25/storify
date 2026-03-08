import "dotenv/config";
import { db } from "../server/db";
import { referralCodes } from "@db/schema";

async function checkReferral() {
  console.log("Checking all referral codes in database...\n");
  
  const allCodes = await db.select().from(referralCodes);
  
  console.log(`Found ${allCodes.length} referral codes:\n`);
  
  for (const code of allCodes) {
    console.log("---");
    console.log("ID:", code.id);
    console.log("Code:", code.code);
    console.log("Code (raw):", JSON.stringify(code.code));
    console.log("User ID:", code.userId);
    console.log("Discount:", code.discountPercent + "%");
    console.log("Active:", code.isActive);
    console.log("Usage:", code.usageCount, "/", code.maxUsage || "unlimited");
    console.log("Expires:", code.expiresAt || "never");
    console.log("");
  }
  
  // Test the specific code
  console.log("Testing 'DISKONLEBARAN' lookup...");
  const testCode = "DISKONLEBARAN";
  console.log("Looking for:", testCode);
  console.log("Looking for (upper):", testCode.toUpperCase().trim());
  
  const { eq } = await import("drizzle-orm");
  const found = await db.query.referralCodes.findFirst({
    where: eq(referralCodes.code, testCode.toUpperCase().trim()),
  });
  
  if (found) {
    console.log("✓ Found the code!");
    console.log(JSON.stringify(found, null, 2));
  } else {
    console.log("✗ Code not found");
  }
  
  process.exit(0);
}

checkReferral().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
