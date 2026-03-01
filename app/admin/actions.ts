"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  checkAdminRateLimit,
  clearAdminSession,
  createInitialAdminCredential,
  createAdminSession,
  getAdminLoginAttemptState,
  isAdminSetupComplete,
  registerAdminRateLimitFailure,
  registerFailedAdminLoginAttempt,
  resetAdminRateLimit,
  resetAdminLoginAttempts,
  requireAdminAuthenticated,
  setAdminCredentials,
  unlockAdminWithSecretPass,
  updateAdminCredentials,
  validateAdminCredentials,
} from "@/lib/admin-auth";

async function getClientFingerprint() {
  const requestHeaders = await headers();
  const ipRaw = requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip") ?? "unknown-ip";
  const ip = ipRaw.split(",")[0]?.trim() || "unknown-ip";
  const userAgent = requestHeaders.get("user-agent") ?? "unknown-agent";
  return `${ip}|${userAgent}`;
}

function required(field: FormDataEntryValue | null, label: string) {
  const value = `${field ?? ""}`.trim();
  if (!value) {
    throw new Error(`${label} is required.`);
  }
  return value;
}

function parseId(field: FormDataEntryValue | null, label: string) {
  const id = Number(required(field, label));
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${label} must be a valid positive number.`);
  }
  return id;
}

function parseDate(field: FormDataEntryValue | null, label: string) {
  const value = required(field, label);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} must be a valid date.`);
  }
  return date;
}

function optional(field: FormDataEntryValue | null) {
  const value = `${field ?? ""}`.trim();
  return value.length > 0 ? value : null;
}

function parseOptionalNumber(field: FormDataEntryValue | null, label: string) {
  const value = `${field ?? ""}`.trim();
  if (!value) {
    return null;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error(`${label} must be a valid non-negative number.`);
  }
  return Math.floor(num);
}

function parsePassword(field: FormDataEntryValue | null, label: string) {
  const value = required(field, label);
  if (value.length < 8) {
    throw new Error(`${label} must be at least 8 characters.`);
  }

  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasDigit = /\d/.test(value);
  const hasSpecial = /[^A-Za-z\d]/.test(value);

  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    throw new Error(`${label} must include uppercase, lowercase, number, and special character.`);
  }

  return value;
}

const allowedNoticeClasses = new Set(["ALL", "5", "6", "7", "8", "9", "10"]);
const allowedMagazineCategories = new Set(["quote", "poem", "story"]);
const allowedBlockTypes = new Set(["TEXT", "IMAGE", "LIST"]);
const allowedPageSlugs = new Set([
  "home",
  "about",
  "admissions",
  "academics",
  "teachers",
  "achievements",
  "events",
  "notices",
  "magazine",
  "contact",
]);

function parseNoticeClass(field: FormDataEntryValue | null) {
  const value = required(field, "Target class").toUpperCase();
  if (!allowedNoticeClasses.has(value)) {
    throw new Error("Target class must be ALL or between 5 and 10.");
  }
  return value;
}

function parseMagazineCategory(field: FormDataEntryValue | null) {
  const value = required(field, "Category").toLowerCase();
  if (!allowedMagazineCategories.has(value)) {
    throw new Error("Category must be quote, poem, or story.");
  }
  return value;
}

function parsePageSlug(field: FormDataEntryValue | null) {
  const value = required(field, "Page").toLowerCase();
  if (!allowedPageSlugs.has(value)) {
    throw new Error("Page slug is invalid.");
  }
  return value;
}

function parseBlockType(field: FormDataEntryValue | null) {
  const value = required(field, "Block type").toUpperCase();
  if (!allowedBlockTypes.has(value)) {
    throw new Error("Block type must be TEXT, IMAGE, or LIST.");
  }
  return value;
}

function parseSortOrder(field: FormDataEntryValue | null) {
  const value = `${field ?? ""}`.trim();
  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Sort order must be a non-negative number.");
  }

  return Math.floor(parsed);
}

function validateBlockPayload(blockType: string, content: string, imageUrl: string | null, lineItems: string | null) {
  if (blockType === "TEXT" && !content) {
    throw new Error("Text block requires content.");
  }

  if (blockType === "IMAGE" && !imageUrl) {
    throw new Error("Image block requires image URL.");
  }

  if (blockType === "LIST" && !lineItems) {
    throw new Error("List block requires line items.");
  }
}

function parseToggle(field: FormDataEntryValue | null) {
  return field === "on";
}

function photoExtensionFromMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "image/svg+xml") return "svg";
  return "jpg";
}

async function saveUploadedImage(file: File, segment: string) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("Image must be less than 5MB.");
  }

  const ext = photoExtensionFromMime(file.type);
  const fileName = `${Date.now()}-${randomUUID()}.${ext}`;
  const relativeDir = path.join("uploads", segment);
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  const absoluteFile = path.join(absoluteDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absoluteFile, buffer);

  return `/${relativeDir.replaceAll("\\", "/")}/${fileName}`;
}

async function resolvePhotoUrl(
  formData: FormData,
  fileField: string,
  urlField: string,
  folder: "teachers" | "students"
) {
  const fileValue = formData.get(fileField);
  const urlValue = optional(formData.get(urlField));

  if (fileValue instanceof File && fileValue.size > 0) {
    return saveUploadedImage(fileValue, folder);
  }

  return urlValue;
}

export type AuthState = {
  error: string | null;
  canUseRecovery?: boolean;
  failedAttempts?: number;
  message?: string | null;
};

export type CredentialState = {
  error: string | null;
  success?: string | null;
};

export async function authenticateAdmin(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const clientFingerprint = await getClientFingerprint();
  const rateState = checkAdminRateLimit("login", clientFingerprint);
  if (!rateState.allowed) {
    return {
      error: `Too many attempts. Please try again in ${rateState.retryAfterSeconds} seconds.`,
      canUseRecovery: false,
    };
  }

  if (!(await isAdminSetupComplete())) {
    return { error: "Admin account is not created yet. Please complete first-time setup." };
  }

  const attemptState = await getAdminLoginAttemptState();
  if (attemptState.canUseRecovery) {
    return {
      error: "Too many failed attempts. Use Secret Pass recovery to reset Admin ID and password.",
      canUseRecovery: true,
      failedAttempts: attemptState.failedAttempts,
    };
  }

  const loginId = `${formData.get("loginId") ?? ""}`.trim();
  const password = `${formData.get("password") ?? ""}`.trim();

  if (!loginId || !password) {
    return { error: "Admin ID and password are required." };
  }

  if (!(await validateAdminCredentials(loginId, password))) {
    registerAdminRateLimitFailure("login", clientFingerprint);
    const updatedAttempts = await registerFailedAdminLoginAttempt();

    if (updatedAttempts.canUseRecovery) {
      return {
        error: "5 failed attempts reached. Use Secret Pass recovery to reset credentials.",
        canUseRecovery: true,
        failedAttempts: updatedAttempts.failedAttempts,
      };
    }

    return {
      error: `Invalid admin ID or password. ${updatedAttempts.remainingAttempts} attempt(s) left before recovery unlock.`,
      canUseRecovery: false,
      failedAttempts: updatedAttempts.failedAttempts,
    };
  }

  resetAdminRateLimit("login", clientFingerprint);
  await resetAdminLoginAttempts();
  await createAdminSession();
  revalidatePath("/admin");
  redirect("/admin");
}

export async function createAdminAccount(_prev: AuthState, formData: FormData): Promise<AuthState> {
  try {
    if (await isAdminSetupComplete()) {
      return { error: "Admin account already exists. Please sign in." };
    }

    const loginId = required(formData.get("loginId"), "Admin ID");
    const password = parsePassword(formData.get("password"), "Password");
    const confirmPassword = parsePassword(formData.get("confirmPassword"), "Confirm password");

    if (password !== confirmPassword) {
      return { error: "Password and confirm password must match." };
    }

    await createInitialAdminCredential(loginId, password);
    await createAdminSession();
    await resetAdminLoginAttempts();
    revalidatePath("/admin");
    redirect("/admin");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create admin account." };
  }
}

export async function recoverAdminAccess(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const clientFingerprint = await getClientFingerprint();
  const rateState = checkAdminRateLimit("recovery", clientFingerprint);
  if (!rateState.allowed) {
    return {
      error: `Recovery temporarily locked. Please try again in ${rateState.retryAfterSeconds} seconds.`,
    };
  }

  const attemptState = await getAdminLoginAttemptState();
  if (!attemptState.canUseRecovery) {
    return { error: "Recovery is available only after 5 failed attempts." };
  }

  const secretPass = `${formData.get("secretPass") ?? ""}`.trim();
  const newLoginId = `${formData.get("newLoginId") ?? ""}`.trim();
  const newPassword = parsePassword(formData.get("newPassword"), "New password");

  if (!secretPass) {
    return { error: "Secret pass is required." };
  }

  if (!newLoginId) {
    return { error: "New Admin ID is required." };
  }

  const ok = await unlockAdminWithSecretPass(secretPass);

  if (!ok) {
    registerAdminRateLimitFailure("recovery", clientFingerprint);
    return { error: "Invalid secret pass." };
  }

  resetAdminRateLimit("recovery", clientFingerprint);
  await setAdminCredentials(newLoginId, newPassword);
  await resetAdminLoginAttempts();

  await createAdminSession();
  revalidatePath("/admin");
  redirect("/admin");
}

export async function changeAdminCredentials(_prev: CredentialState, formData: FormData): Promise<CredentialState> {
  try {
    await requireAdminAuthenticated();

    const currentPassword = required(formData.get("currentPassword"), "Current password");
    const newLoginId = required(formData.get("newLoginId"), "New Admin ID");
    const newPassword = parsePassword(formData.get("newPassword"), "New password");
    const confirmPassword = parsePassword(formData.get("confirmPassword"), "Confirm password");

    if (newPassword !== confirmPassword) {
      return { error: "New password and confirm password must match." };
    }

    const currentCredential = await prisma.adminCredential.findUnique({
      where: { id: 1 },
      select: { loginId: true },
    });

    if (!currentCredential) {
      return { error: "Admin account is not configured." };
    }

    await updateAdminCredentials(currentCredential.loginId, currentPassword, newLoginId, newPassword);
    await resetAdminLoginAttempts();
    await createAdminSession();
    revalidatePath("/admin");

    return { error: null, success: "Admin credentials updated successfully." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update admin credentials." };
  }
}

export async function logoutAdmin() {
  await clearAdminSession();
  revalidatePath("/admin");
}

export async function updateSettings(formData: FormData) {
  await requireAdminAuthenticated();

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {
      schoolName: required(formData.get("schoolName"), "School name"),
      tagline: required(formData.get("tagline"), "Tagline"),
      address: required(formData.get("address"), "Address"),
      phone: required(formData.get("phone"), "Phone"),
      email: required(formData.get("email"), "Email"),
      principalMessage: required(formData.get("principalMessage"), "Principal message"),
    },
    create: {
      id: 1,
      schoolName: required(formData.get("schoolName"), "School name"),
      tagline: required(formData.get("tagline"), "Tagline"),
      address: required(formData.get("address"), "Address"),
      phone: required(formData.get("phone"), "Phone"),
      email: required(formData.get("email"), "Email"),
      principalMessage: required(formData.get("principalMessage"), "Principal message"),
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updatePage(formData: FormData) {
  await requireAdminAuthenticated();

  const slug = required(formData.get("slug"), "Slug");

  await prisma.page.upsert({
    where: { slug },
    update: {
      title: required(formData.get("title"), "Title"),
      content: required(formData.get("content"), "Content"),
    },
    create: {
      slug,
      title: required(formData.get("title"), "Title"),
      content: required(formData.get("content"), "Content"),
    },
  });

  revalidatePath(`/${slug}`);
  revalidatePath("/admin");
}

export async function createEvent(formData: FormData) {
  await requireAdminAuthenticated();

  await prisma.event.create({
    data: {
      title: required(formData.get("title"), "Title"),
      description: required(formData.get("description"), "Description"),
      eventDate: parseDate(formData.get("eventDate"), "Date"),
    },
  });

  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/admin");
}

export async function deleteEvent(formData: FormData) {
  await requireAdminAuthenticated();

  const id = parseId(formData.get("id"), "Event id");
  await prisma.event.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/admin");
}

export async function updateEvent(formData: FormData) {
  await requireAdminAuthenticated();

  const id = parseId(formData.get("id"), "Event id");

  await prisma.event.update({
    where: { id },
    data: {
      title: required(formData.get("title"), "Title"),
      description: required(formData.get("description"), "Description"),
      eventDate: parseDate(formData.get("eventDate"), "Date"),
    },
  });

  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/admin");
}

export async function createNotice(formData: FormData) {
  await requireAdminAuthenticated();

  await prisma.notice.create({
    data: {
      title: required(formData.get("title"), "Title"),
      content: required(formData.get("content"), "Content"),
      targetClass: parseNoticeClass(formData.get("targetClass")),
    },
  });

  revalidatePath("/");
  revalidatePath("/notices");
  revalidatePath("/admin");
}

export async function deleteNotice(formData: FormData) {
  await requireAdminAuthenticated();

  const id = parseId(formData.get("id"), "Notice id");
  await prisma.notice.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/notices");
  revalidatePath("/admin");
}

export async function updateNotice(formData: FormData) {
  await requireAdminAuthenticated();

  const id = parseId(formData.get("id"), "Notice id");

  await prisma.notice.update({
    where: { id },
    data: {
      title: required(formData.get("title"), "Title"),
      content: required(formData.get("content"), "Content"),
      targetClass: parseNoticeClass(formData.get("targetClass")),
    },
  });

  revalidatePath("/");
  revalidatePath("/notices");
  revalidatePath("/admin");
}

export async function createTeacher(formData: FormData) {
  await requireAdminAuthenticated();

  const photoUrl = await resolvePhotoUrl(formData, "photoFile", "photoUrl", "teachers");

  await prisma.teacher.create({
    data: {
      name: required(formData.get("name"), "Teacher name"),
      designation: required(formData.get("designation"), "Designation"),
      department: required(formData.get("department"), "Department"),
      bio: required(formData.get("bio"), "Portfolio summary"),
      photoUrl,
      experienceYears: parseOptionalNumber(formData.get("experienceYears"), "Experience years"),
      email: optional(formData.get("email")),
      achievements: optional(formData.get("achievements")),
    },
  });

  revalidatePath("/");
  revalidatePath("/teachers");
  revalidatePath("/admin");
}

export async function updateTeacher(formData: FormData) {
  await requireAdminAuthenticated();

  const id = parseId(formData.get("id"), "Teacher id");
  const photoUrl = await resolvePhotoUrl(formData, "photoFile", "photoUrl", "teachers");

  await prisma.teacher.update({
    where: { id },
    data: {
      name: required(formData.get("name"), "Teacher name"),
      designation: required(formData.get("designation"), "Designation"),
      department: required(formData.get("department"), "Department"),
      bio: required(formData.get("bio"), "Portfolio summary"),
      photoUrl,
      experienceYears: parseOptionalNumber(formData.get("experienceYears"), "Experience years"),
      email: optional(formData.get("email")),
      achievements: optional(formData.get("achievements")),
    },
  });

  revalidatePath("/");
  revalidatePath("/teachers");
  revalidatePath("/admin");
}

export async function deleteTeacher(formData: FormData) {
  await requireAdminAuthenticated();

  const id = parseId(formData.get("id"), "Teacher id");
  await prisma.teacher.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/teachers");
  revalidatePath("/admin");
}

export async function createStudentAchievement(formData: FormData) {
  await requireAdminAuthenticated();

  const photoUrl = await resolvePhotoUrl(formData, "photoFile", "photoUrl", "students");

  await prisma.studentAchievement.create({
    data: {
      studentName: required(formData.get("studentName"), "Student name"),
      exam: required(formData.get("exam"), "Exam"),
      rank: required(formData.get("rank"), "Rank"),
      passedOutYear: parseId(formData.get("passedOutYear"), "Passed-out year"),
      story: required(formData.get("story"), "Story"),
      photoUrl,
    },
  });

  revalidatePath("/");
  revalidatePath("/achievements");
  revalidatePath("/admin");
}

export async function updateStudentAchievement(formData: FormData) {
  await requireAdminAuthenticated();

  const id = parseId(formData.get("id"), "Achievement id");
  const photoUrl = await resolvePhotoUrl(formData, "photoFile", "photoUrl", "students");

  await prisma.studentAchievement.update({
    where: { id },
    data: {
      studentName: required(formData.get("studentName"), "Student name"),
      exam: required(formData.get("exam"), "Exam"),
      rank: required(formData.get("rank"), "Rank"),
      passedOutYear: parseId(formData.get("passedOutYear"), "Passed-out year"),
      story: required(formData.get("story"), "Story"),
      photoUrl,
    },
  });

  revalidatePath("/");
  revalidatePath("/achievements");
  revalidatePath("/admin");
}

export async function deleteStudentAchievement(formData: FormData) {
  await requireAdminAuthenticated();

  const id = parseId(formData.get("id"), "Achievement id");
  await prisma.studentAchievement.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/achievements");
  revalidatePath("/admin");
}

export async function createMagazinePost(formData: FormData) {
  await requireAdminAuthenticated();

  await prisma.magazinePost.create({
    data: {
      title: required(formData.get("title"), "Title"),
      category: parseMagazineCategory(formData.get("category")),
      content: required(formData.get("content"), "Content"),
      author: optional(formData.get("author")),
    },
  });

  revalidatePath("/");
  revalidatePath("/magazine");
  revalidatePath("/admin");
}

export async function updateMagazinePost(formData: FormData) {
  await requireAdminAuthenticated();

  const id = parseId(formData.get("id"), "Magazine post id");

  await prisma.magazinePost.update({
    where: { id },
    data: {
      title: required(formData.get("title"), "Title"),
      category: parseMagazineCategory(formData.get("category")),
      content: required(formData.get("content"), "Content"),
      author: optional(formData.get("author")),
    },
  });

  revalidatePath("/");
  revalidatePath("/magazine");
  revalidatePath("/admin");
}

export async function deleteMagazinePost(formData: FormData) {
  await requireAdminAuthenticated();

  const id = parseId(formData.get("id"), "Magazine post id");
  await prisma.magazinePost.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/magazine");
  revalidatePath("/admin");
}

export async function createImportantBox(formData: FormData) {
  await requireAdminAuthenticated();

  const pageSlug = parsePageSlug(formData.get("pageSlug"));
  const blockType = parseBlockType(formData.get("blockType"));
  const content = `${formData.get("content") ?? ""}`.trim();
  const imageUrl = optional(formData.get("imageUrl"));
  const lineItems = optional(formData.get("lineItems"));
  validateBlockPayload(blockType, content, imageUrl, lineItems);

  await prisma.importantBox.create({
    data: {
      pageSlug,
      blockType,
      sortOrder: parseSortOrder(formData.get("sortOrder")),
      title: required(formData.get("title"), "Title"),
      content,
      imageUrl,
      lineItems,
      isActive: parseToggle(formData.get("isActive")),
    },
  });

  revalidatePath("/");
  revalidatePath(pageSlug === "home" ? "/" : `/${pageSlug}`);
  revalidatePath("/admin");
}

export async function updateImportantBox(formData: FormData) {
  await requireAdminAuthenticated();

  const id = parseId(formData.get("id"), "Important box id");
  const pageSlug = parsePageSlug(formData.get("pageSlug"));
  const blockType = parseBlockType(formData.get("blockType"));
  const content = `${formData.get("content") ?? ""}`.trim();
  const imageUrl = optional(formData.get("imageUrl"));
  const lineItems = optional(formData.get("lineItems"));
  validateBlockPayload(blockType, content, imageUrl, lineItems);

  const existing = await prisma.importantBox.findUnique({ where: { id }, select: { pageSlug: true } });

  await prisma.importantBox.update({
    where: { id },
    data: {
      pageSlug,
      blockType,
      sortOrder: parseSortOrder(formData.get("sortOrder")),
      title: required(formData.get("title"), "Title"),
      content,
      imageUrl,
      lineItems,
      isActive: parseToggle(formData.get("isActive")),
    },
  });

  revalidatePath("/");
  if (existing?.pageSlug && existing.pageSlug !== pageSlug) {
    revalidatePath(existing.pageSlug === "home" ? "/" : `/${existing.pageSlug}`);
  }
  revalidatePath(pageSlug === "home" ? "/" : `/${pageSlug}`);
  revalidatePath("/admin");
}

export async function deleteImportantBox(formData: FormData) {
  await requireAdminAuthenticated();

  const id = parseId(formData.get("id"), "Important box id");
  const existing = await prisma.importantBox.findUnique({ where: { id }, select: { pageSlug: true } });
  await prisma.importantBox.delete({ where: { id } });

  revalidatePath("/");
  if (existing?.pageSlug) {
    revalidatePath(existing.pageSlug === "home" ? "/" : `/${existing.pageSlug}`);
  }
  revalidatePath("/admin");
}
