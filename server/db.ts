import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, transactions, contacts, delegations } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "walletAddress", "evmUniversalAddress", "solanaUniversalAddress", "username"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByWalletAddress(walletAddress: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const normalized = walletAddress.toLowerCase();
  const result = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, normalized))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Update user's wallet addresses
 */
export async function updateUserWalletAddresses(
  userId: number,
  walletAddress?: string,
  evmUniversalAddress?: string,
  solanaUniversalAddress?: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update wallet addresses: database not available");
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (walletAddress !== undefined) updateData.walletAddress = walletAddress;
  if (evmUniversalAddress !== undefined) updateData.evmUniversalAddress = evmUniversalAddress;
  if (solanaUniversalAddress !== undefined) updateData.solanaUniversalAddress = solanaUniversalAddress;

  if (Object.keys(updateData).length === 0) return;

  await db.update(users).set(updateData).where(eq(users.id, userId));
}

/**
 * Update user's username
 */
export async function updateUserUsername(userId: number, username: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update username: database not available");
    return;
  }

  await db.update(users).set({ username }).where(eq(users.id, userId));
}

/**
 * Get user's transaction history
 */
export async function getUserTransactions(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get transactions: database not available");
    return [];
  }

  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy((t) => t.createdAt)
    .limit(limit);

  return result;
}

/**
 * Create a new transaction record
 */
export async function createTransaction(data: {
  userId: number;
  senderAddress: string;
  recipientAddress: string;
  token: string;
  amount: string;
  sourceChain: string;
  destinationChain: string;
  status?: "pending" | "confirmed" | "failed";
  transactionHash?: string;
  note?: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create transaction: database not available");
    return;
  }

  await db.insert(transactions).values({
    ...data,
    status: data.status || "pending",
  });
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  transactionHash: string,
  status: "pending" | "confirmed" | "failed"
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update transaction: database not available");
    return;
  }

  await db
    .update(transactions)
    .set({ status })
    .where(eq(transactions.transactionHash, transactionHash));
}

/**
 * Get or create a contact
 */
export async function upsertContact(userId: number, address: string, name?: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert contact: database not available");
    return;
  }

  const existing = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.userId, userId), eq(contacts.address, address)))
    .limit(1);

  if (existing.length > 0) {
    if (name) {
      await db
        .update(contacts)
        .set({ name })
        .where(and(eq(contacts.userId, userId), eq(contacts.address, address)));
    }
    return existing[0];
  }

  await db.insert(contacts).values({
    userId,
    address,
    name: name || address,
  });
}

/**
 * Get user's contacts
 */
export async function getUserContacts(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get contacts: database not available");
    return [];
  }

  return await db.select().from(contacts).where(eq(contacts.userId, userId));
}

/**
 * Get or create delegation record for a chain
 */
export async function upsertDelegation(userId: number, chainId: number, chainName: string, isDelegated: boolean, delegatedAddress?: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert delegation: database not available");
    return;
  }

  const existing = await db
    .select()
    .from(delegations)
    .where(and(eq(delegations.userId, userId), eq(delegations.chainId, chainId)))
    .limit(1);

  if (existing.length > 0) {
    const updateData: Record<string, unknown> = { isDelegated, updatedAt: new Date() };
    if (delegatedAddress !== undefined) updateData.delegatedAddress = delegatedAddress;
    await db
      .update(delegations)
      .set(updateData)
      .where(and(eq(delegations.userId, userId), eq(delegations.chainId, chainId)));
    return existing[0];
  }

  await db.insert(delegations).values({
    userId,
    chainId,
    chainName,
    isDelegated,
    delegatedAddress: delegatedAddress || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/**
 * Get user's delegation status for all chains
 */
export async function getUserDelegations(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get delegations: database not available");
    return [];
  }

  return await db.select().from(delegations).where(eq(delegations.userId, userId));
}

/**
 * Get delegation status for a specific chain
 */
export async function getDelegationStatus(userId: number, chainId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get delegation status: database not available");
    return null;
  }

  const result = await db
    .select()
    .from(delegations)
    .where(and(eq(delegations.userId, userId), eq(delegations.chainId, chainId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}
