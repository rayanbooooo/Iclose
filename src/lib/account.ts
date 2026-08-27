import "server-only";

import { db } from "@/lib/db";

export async function getActiveAccountWithRule() {
  return db.account.findFirst({
    where: { isActive: true },
    include: { payoutRule: true },
  });
}
