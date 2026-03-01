import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const DEV_ADMIN_SESSION_COOKIE = "amarargarh_admin_session";
const PROD_ADMIN_SESSION_COOKIE = "__Host-amarargarh_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const MAX_FAILED_ATTEMPTS = 5;
const DEV_SESSION_SECRET_FALLBACK = "amarargarh-dev-session-secret-change-in-production";
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_LOCK_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS_PER_WINDOW = 12;
const RECOVERY_MAX_ATTEMPTS_PER_WINDOW = 8;

type RateLimitScope = "login" | "recovery";

type RateLimitRecord = {
  count: number;
  windowStartedAt: number;
  lockedUntil: number;
};

const globalForAdminRateLimit = globalThis as typeof globalThis & {
  adminRateLimitStore?: Map<string, RateLimitRecord>;
};

function getRateLimitStore() {
  if (!globalForAdminRateLimit.adminRateLimitStore) {
    globalForAdminRateLimit.adminRateLimitStore = new Map<string, RateLimitRecord>();
  }
  return globalForAdminRateLimit.adminRateLimitStore;
}

function getScopeLimit(scope: RateLimitScope) {
  return scope === "recovery" ? RECOVERY_MAX_ATTEMPTS_PER_WINDOW : LOGIN_MAX_ATTEMPTS_PER_WINDOW;
}

function getRateKey(scope: RateLimitScope, clientFingerprint: string) {
  return `${scope}:${createHash("sha256").update(clientFingerprint).digest("hex")}`;
}

function getOrCreateRateRecord(key: string, now: number) {
  const store = getRateLimitStore();
  const existing = store.get(key);

  if (!existing) {
    const created: RateLimitRecord = { count: 0, windowStartedAt: now, lockedUntil: 0 };
    store.set(key, created);
    return created;
  }

  if (now - existing.windowStartedAt > RATE_LIMIT_WINDOW_MS) {
    existing.count = 0;
    existing.windowStartedAt = now;
  }

  return existing;
}

type AdminCredentialRecord = {
  id: number;
  loginId: string;
  passwordHash: string;
  failedAttempts: number;
  recoveryUnlocked: boolean;
  sessionNonce: string;
};

type AdminCredentialDelegate = {
  findUnique(args: { where: { id: number } }): Promise<AdminCredentialRecord | null>;
  create(args: {
    data: {
      id: number;
      loginId: string;
      passwordHash: string;
      failedAttempts: number;
      recoveryUnlocked: boolean;
      sessionNonce?: string;
    };
  }): Promise<AdminCredentialRecord>;
  upsert(args: {
    where: { id: number };
    update: {
      loginId: string;
      passwordHash: string;
      failedAttempts: number;
      recoveryUnlocked: boolean;
      sessionNonce?: string;
    };
    create: {
      id: number;
      loginId: string;
      passwordHash: string;
      failedAttempts: number;
      recoveryUnlocked: boolean;
      sessionNonce?: string;
    };
  }): Promise<AdminCredentialRecord>;
  update(args: {
    where: { id: number };
    data: {
      loginId?: string;
      passwordHash?: string;
      failedAttempts?: number;
      recoveryUnlocked?: boolean;
      sessionNonce?: string;
    };
  }): Promise<AdminCredentialRecord>;
};

const adminCredentialModel = (prisma as unknown as { adminCredential: AdminCredentialDelegate }).adminCredential;

function optionalEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function getSessionSecret() {
  const configured = optionalEnv("ADMIN_SESSION_SECRET");

  if (process.env.NODE_ENV === "production") {
    if (!configured || configured === DEV_SESSION_SECRET_FALLBACK || configured.length < 32) {
      throw new Error("ADMIN_SESSION_SECRET must be set to a strong value (minimum 32 chars) in production.");
    }
    return configured;
  }

  return configured ?? DEV_SESSION_SECRET_FALLBACK;
}

function getAdminSessionCookieName() {
  return process.env.NODE_ENV === "production" ? PROD_ADMIN_SESSION_COOKIE : DEV_ADMIN_SESSION_COOKIE;
}

function getRecoverySecretPass() {
  return optionalEnv("ADMIN_RECOVERY_SECRET_PASS");
}

function isRecoveryEnabled() {
  return getRecoverySecretPass() !== null;
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function safeEqual(left: string, right: string) {
  return timingSafeEqual(digest(left), digest(right));
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function createSessionToken(sessionNonce: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({
    sub: "admin",
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
    sid: sessionNonce,
    nonce: randomBytes(16).toString("hex"),
  });

  const encodedPayload = base64UrlEncode(payload);
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

async function verifySessionToken(token: string | undefined) {
  if (!token) {
    return false;
  }

  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) {
    return false;
  }

  const expectedSignature = sign(encodedPayload);
  const signatureMatches =
    providedSignature.length === expectedSignature.length &&
    timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature));

  if (!signatureMatches) {
    return false;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as {
      sub?: string;
      exp?: number;
      sid?: string;
    };

    if (payload.sub !== "admin" || typeof payload.exp !== "number" || typeof payload.sid !== "string") {
      return false;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return false;
    }

    const credential = await getAdminCredential();
    if (!credential?.sessionNonce) {
      return false;
    }

    return safeEqual(payload.sid, credential.sessionNonce);
  } catch {
    return false;
  }
}

function hashPassword(password: string, salt?: string) {
  const finalSalt = salt ?? randomBytes(16).toString("hex");
  const derived = scryptSync(password, finalSalt, 64).toString("hex");
  return `scrypt$${finalSalt}$${derived}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, digestHex] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !digestHex) {
    return false;
  }

  const computed = hashPassword(password, salt);
  const computedDigestHex = computed.split("$")[2];
  if (!computedDigestHex || computedDigestHex.length !== digestHex.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(computedDigestHex, "hex"), Buffer.from(digestHex, "hex"));
}

export async function getAdminCredential() {
  return adminCredentialModel.findUnique({ where: { id: 1 } });
}

export async function isAdminSetupComplete() {
  const credential = await getAdminCredential();
  return credential !== null;
}

export async function createInitialAdminCredential(loginId: string, password: string) {
  const existing = await getAdminCredential();
  if (existing) {
    throw new Error("Admin account already exists.");
  }

  await adminCredentialModel.create({
    data: {
      id: 1,
      loginId,
      passwordHash: hashPassword(password),
      failedAttempts: 0,
      recoveryUnlocked: false,
      sessionNonce: "",
    },
  });
}

export async function setAdminCredentials(loginId: string, password: string) {
  await adminCredentialModel.upsert({
    where: { id: 1 },
    update: {
      loginId,
      passwordHash: hashPassword(password),
      failedAttempts: 0,
      recoveryUnlocked: false,
      sessionNonce: "",
    },
    create: {
      id: 1,
      loginId,
      passwordHash: hashPassword(password),
      failedAttempts: 0,
      recoveryUnlocked: false,
      sessionNonce: "",
    },
  });
}

export async function validateAdminCredentials(loginId: string, password: string) {
  const credential = await getAdminCredential();
  if (!credential) {
    return false;
  }

  if (!safeEqual(loginId, credential.loginId)) {
    return false;
  }

  return verifyPassword(password, credential.passwordHash);
}

export async function updateAdminCredentials(
  currentLoginId: string,
  currentPassword: string,
  nextLoginId: string,
  nextPassword: string
) {
  const credential = await getAdminCredential();

  if (!credential) {
    throw new Error("Admin account is not configured.");
  }

  const currentIdMatches = safeEqual(currentLoginId, credential.loginId);
  const currentPasswordMatches = verifyPassword(currentPassword, credential.passwordHash);

  if (!currentIdMatches || !currentPasswordMatches) {
    throw new Error("Current admin ID or password is incorrect.");
  }

  await adminCredentialModel.update({
    where: { id: credential.id },
    data: {
      loginId: nextLoginId,
      passwordHash: hashPassword(nextPassword),
      failedAttempts: 0,
      recoveryUnlocked: false,
      sessionNonce: "",
    },
  });
}

export async function createAdminSession() {
  const credential = await getAdminCredential();
  if (!credential) {
    throw new Error("Admin account is not configured.");
  }

  const nextSessionNonce = randomBytes(24).toString("hex");
  await adminCredentialModel.update({
    where: { id: credential.id },
    data: { sessionNonce: nextSessionNonce },
  });

  const cookieStore = await cookies();
  cookieStore.set(getAdminSessionCookieName(), createSessionToken(nextSessionNonce), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession() {
  const credential = await getAdminCredential();
  if (credential) {
    await adminCredentialModel.update({
      where: { id: credential.id },
      data: { sessionNonce: randomBytes(24).toString("hex") },
    });
  }

  const cookieStore = await cookies();
  cookieStore.delete(getAdminSessionCookieName());
}

export async function getAdminLoginAttemptState() {
  const credential = await getAdminCredential();
  const failedAttempts = credential?.failedAttempts ?? 0;
  const canUseRecovery = isRecoveryEnabled() && (credential?.recoveryUnlocked ?? false);

  return {
    failedAttempts,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts),
    canUseRecovery,
  };
}

export async function registerFailedAdminLoginAttempt() {
  const credential = await getAdminCredential();
  if (!credential) {
    return {
      failedAttempts: 0,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
      canUseRecovery: false,
    };
  }

  const nextCount = Math.min(MAX_FAILED_ATTEMPTS, credential.failedAttempts + 1);
  const canUseRecovery = isRecoveryEnabled() && nextCount >= MAX_FAILED_ATTEMPTS;

  await adminCredentialModel.update({
    where: { id: credential.id },
    data: {
      failedAttempts: nextCount,
      recoveryUnlocked: canUseRecovery,
    },
  });

  return {
    failedAttempts: nextCount,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - nextCount),
    canUseRecovery,
  };
}

export async function resetAdminLoginAttempts() {
  const credential = await getAdminCredential();
  if (!credential) {
    return;
  }

  await adminCredentialModel.update({
    where: { id: credential.id },
    data: {
      failedAttempts: 0,
      recoveryUnlocked: false,
    },
  });
}

export async function unlockAdminWithSecretPass(secretPass: string) {
  const configuredSecretPass = getRecoverySecretPass();
  if (!configuredSecretPass) {
    return false;
  }

  const ok = safeEqual(secretPass, configuredSecretPass);
  if (ok) {
    await resetAdminLoginAttempts();
  }
  return ok;
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(getAdminSessionCookieName())?.value);
}

export async function requireAdminAuthenticated() {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized admin access.");
  }
}

export function checkAdminRateLimit(scope: RateLimitScope, clientFingerprint: string) {
  const now = Date.now();
  const key = getRateKey(scope, clientFingerprint);
  const record = getOrCreateRateRecord(key, now);

  if (record.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function registerAdminRateLimitFailure(scope: RateLimitScope, clientFingerprint: string) {
  const now = Date.now();
  const key = getRateKey(scope, clientFingerprint);
  const record = getOrCreateRateRecord(key, now);

  record.count += 1;
  if (record.count >= getScopeLimit(scope)) {
    record.lockedUntil = now + RATE_LIMIT_LOCK_MS;
  }
}

export function resetAdminRateLimit(scope: RateLimitScope, clientFingerprint: string) {
  const key = getRateKey(scope, clientFingerprint);
  const store = getRateLimitStore();
  store.delete(key);
}
