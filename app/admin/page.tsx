import type { Metadata } from "next";
import { ensureDefaults } from "@/lib/content";
import { normalizeDynamicBlock, sortDynamicBlocks } from "@/lib/dynamic-blocks";
import { prisma } from "@/lib/prisma";
import {
  createImportantBox,
  createStudentAchievement,
  createMagazinePost,
  createTeacher,
  createEvent,
  createNotice,
  deleteImportantBox,
  deleteMagazinePost,
  deleteStudentAchievement,
  deleteTeacher,
  deleteEvent,
  deleteNotice,
  logoutAdmin,
  updateImportantBox,
  updateMagazinePost,
  updateStudentAchievement,
  updateTeacher,
  updateEvent,
  updateNotice,
  updatePage,
  updateSettings,
} from "@/app/admin/actions";
import { getAdminLoginAttemptState, isAdminAuthenticated, isAdminSetupComplete } from "../../lib/admin-auth";
import { AdminCredentialsForm } from "@/app/admin/admin-credentials-form";
import { AdminSectionNav } from "@/app/admin/admin-section-nav";
import { AdminSubmitFeedback } from "@/app/admin/admin-submit-feedback";
import { AdminLoginPanel } from "@/app/admin/admin-login-panel";
import { AdminStatGrid } from "@/app/admin/admin-stat-grid";
import {
  blockTypeOptions,
  magazineCategoryOptions,
  noticeClassOptions,
  pageSlugOptions,
} from "@/app/admin/admin-constants";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Administrative dashboard for Amarargarh High School content management.",
  robots: {
    index: false,
    follow: false,
  },
};

function asDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function AdminPage() {
  await ensureDefaults();

  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    const [setupComplete, attemptState] = await Promise.all([isAdminSetupComplete(), getAdminLoginAttemptState()]);

    return (
      <AdminLoginPanel
        setupComplete={setupComplete}
        canUseRecovery={attemptState.canUseRecovery}
        failedAttempts={attemptState.failedAttempts}
      />
    );
  }

  const [settings, pages, events, notices, teachers, achievements, magazinePosts, importantBoxes] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: 1 } }),
    prisma.page.findMany({ orderBy: { slug: "asc" } }),
    prisma.event.findMany({ orderBy: { eventDate: "asc" } }),
    prisma.notice.findMany({ orderBy: { publishedAt: "desc" } }),
    prisma.teacher.findMany({ orderBy: [{ department: "asc" }, { name: "asc" }] }),
    prisma.studentAchievement.findMany({ orderBy: [{ passedOutYear: "desc" }, { studentName: "asc" }] }),
    prisma.magazinePost.findMany({ orderBy: { publishedAt: "desc" } }),
    prisma.importantBox.findMany({ orderBy: [{ pageSlug: "asc" }, { createdAt: "desc" }] }),
  ]);

  const normalizedImportantBoxes = sortDynamicBlocks(importantBoxes.map(normalizeDynamicBlock));

  return (
    <div className="admin-dashboard space-y-8" data-admin-root>
      <AdminSubmitFeedback />
      <header className="admin-header-box flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-700/70 bg-slate-900/70 p-5">
        <div>
        <h2 className="section-title">Admin Dashboard</h2>
          <p className="mt-2 text-sm text-slate-300">Manage school profile, page content, notices, and events from one place.</p>
        </div>
        <form action={logoutAdmin}>
          <button className="admin-ghost-btn rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800">
            Logout
          </button>
        </form>
      </header>

      <AdminStatGrid
        items={[
          { label: "Pages", value: pages.length },
          { label: "Events", value: events.length },
          { label: "Notices", value: notices.length },
          { label: "Teachers", value: teachers.length },
          { label: "Achievements", value: achievements.length },
          { label: "Magazine", value: magazinePosts.length },
          { label: "Important Boxes", value: normalizedImportantBoxes.length },
        ]}
        lastUpdated={settings?.updatedAt}
      />

      <AdminSectionNav />

      <section id="admin-security" className="card scroll-mt-24">
        <h3 className="mb-4 text-lg font-semibold">Admin Security</h3>
        <p className="mb-4 text-sm text-slate-300">
          Change your Admin ID and password from here. All credentials are stored securely on the server database.
        </p>
        <AdminCredentialsForm />
      </section>

      <section id="site-settings" className="card scroll-mt-24">
        <h3 className="mb-4 text-lg font-semibold">Site Settings</h3>
        <form action={updateSettings} className="grid gap-3 md:grid-cols-2">
          <input name="schoolName" defaultValue={settings?.schoolName} className="input-base" placeholder="School name" />
          <input name="tagline" defaultValue={settings?.tagline} className="input-base" placeholder="Tagline" />
          <input name="address" defaultValue={settings?.address} className="input-base" placeholder="Address" />
          <input name="phone" defaultValue={settings?.phone} className="input-base" placeholder="Phone" />
          <input name="email" defaultValue={settings?.email} className="input-base md:col-span-2" placeholder="Email" />
          <textarea
            name="principalMessage"
            defaultValue={settings?.principalMessage}
            className="input-base min-h-28 md:col-span-2"
            placeholder="Principal message"
          />
          <button className="btn-primary w-fit md:col-span-2">Save settings</button>
        </form>
      </section>

      <section id="page-content" className="card scroll-mt-24">
        <h3 className="mb-4 text-lg font-semibold">Page Content</h3>
        <div className="space-y-6">
          {pages.map((page) => (
            <form key={page.id} action={updatePage} className="admin-subcard space-y-3 rounded-xl border border-slate-700/80 bg-slate-900/80 p-4">
              <input type="hidden" name="slug" value={page.slug} />
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">{page.slug}</p>
              <input name="title" defaultValue={page.title} className="input-base" />
              <textarea name="content" defaultValue={page.content} className="input-base min-h-28" />
              <button className="btn-primary">Save {page.slug}</button>
            </form>
          ))}
        </div>
      </section>

      <section id="important-boxes" className="card scroll-mt-24">
        <h3 className="mb-4 text-lg font-semibold">Dynamic Content Blocks (Advanced)</h3>
        <form action={createImportantBox} className="grid gap-3 md:grid-cols-3">
          <select name="pageSlug" className="input-base">
            {pageSlugOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select name="blockType" className="input-base" defaultValue="TEXT">
            {blockTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <input name="sortOrder" type="number" min={0} className="input-base" placeholder="Display order (0 first)" />
          <input name="title" className="input-base" placeholder="Box title" />
          <label className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200">
            <input type="checkbox" name="isActive" defaultChecked /> Active
          </label>
          <input name="imageUrl" className="input-base md:col-span-2" placeholder="Image URL (required for IMAGE type)" />
          <textarea
            name="lineItems"
            className="input-base min-h-20 md:col-span-3"
            placeholder="List lines (required for LIST type, one line per item)"
          />
          <textarea
            name="content"
            className="input-base min-h-24 md:col-span-3"
            placeholder="Text content (required for TEXT type, optional caption for IMAGE)"
          />
          <button className="btn-primary w-fit md:col-span-3">Add dynamic block</button>
        </form>

        <ul className="mt-6 space-y-3">
          {normalizedImportantBoxes.map((box) => (
            <li key={box.id} className="admin-subcard rounded-xl border border-slate-700/80 bg-slate-900/80 p-4">
              <form action={updateImportantBox} className="grid gap-3 md:grid-cols-3">
                <input type="hidden" name="id" value={box.id} />
                <select name="pageSlug" defaultValue={box.pageSlug} className="input-base">
                  {pageSlugOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <select name="blockType" defaultValue={box.blockType} className="input-base">
                  {blockTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <input
                  name="sortOrder"
                  type="number"
                  min={0}
                  defaultValue={box.sortOrder}
                  className="input-base"
                  placeholder="Display order"
                />
                <input name="title" defaultValue={box.title} className="input-base" />
                <label className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200">
                  <input type="checkbox" name="isActive" defaultChecked={box.isActive} /> Active
                </label>
                <input
                  name="imageUrl"
                  defaultValue={box.imageUrl ?? ""}
                  className="input-base md:col-span-2"
                  placeholder="Image URL"
                />
                <textarea
                  name="lineItems"
                  defaultValue={box.lineItems ?? ""}
                  className="input-base min-h-20 md:col-span-3"
                  placeholder="One line per item"
                />
                <textarea name="content" defaultValue={box.content} className="input-base min-h-24 md:col-span-3" />
                <button className="btn-primary w-fit">Update box</button>
              </form>
              <form action={deleteImportantBox} className="mt-3">
                <input type="hidden" name="id" value={box.id} />
                <button className="btn-danger">Delete</button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section id="events" className="card scroll-mt-24">
        <h3 className="mb-4 text-lg font-semibold">Events Management</h3>
        <form action={createEvent} className="grid gap-3 md:grid-cols-3">
          <input name="title" className="input-base" placeholder="Event title" />
          <input name="eventDate" type="date" className="input-base" />
          <input name="description" className="input-base" placeholder="Description" />
          <button className="btn-primary w-fit md:col-span-3">Add event</button>
        </form>

        <ul className="mt-6 space-y-3">
          {events.map((event) => (
            <li key={event.id} className="admin-subcard rounded-xl border border-slate-700/80 bg-slate-900/80 p-4">
              <form action={updateEvent} className="grid gap-3 md:grid-cols-[1fr_180px_1fr_auto_auto] md:items-end">
                <input type="hidden" name="id" value={event.id} />
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-300">Title</label>
                  <input name="title" defaultValue={event.title} className="input-base" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-300">Date</label>
                  <input name="eventDate" type="date" defaultValue={asDateInput(event.eventDate)} className="input-base" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-300">Description</label>
                  <input name="description" defaultValue={event.description} className="input-base" />
                </div>
                <button className="btn-primary">Update</button>
              </form>

              <form action={deleteEvent} className="mt-2">
                <input type="hidden" name="id" value={event.id} />
                <button className="btn-danger">Delete</button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section id="notices" className="card scroll-mt-24">
        <h3 className="mb-4 text-lg font-semibold">Notices Management</h3>
        <form action={createNotice} className="grid gap-3 md:grid-cols-2">
          <input name="title" className="input-base" placeholder="Notice title" />
          <input name="content" className="input-base" placeholder="Notice content" />
          <select name="targetClass" className="input-base">
            {noticeClassOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button className="btn-primary w-fit md:col-span-2">Add notice</button>
        </form>

        <ul className="mt-6 space-y-3">
          {notices.map((notice) => (
            <li key={notice.id} className="admin-subcard rounded-xl border border-slate-700/80 bg-slate-900/80 p-4">
              <form action={updateNotice} className="grid gap-3 md:grid-cols-[1fr_1.5fr_auto] md:items-end">
                <input type="hidden" name="id" value={notice.id} />
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-300">Title</label>
                  <input name="title" defaultValue={notice.title} className="input-base" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-300">Content</label>
                  <input name="content" defaultValue={notice.content} className="input-base" />
                </div>
                <select name="targetClass" defaultValue={notice.targetClass} className="input-base">
                  {noticeClassOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <button className="btn-primary">Update</button>
              </form>

              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-slate-400">Published {notice.publishedAt.toDateString()} · {notice.targetClass === "ALL" ? "All Classes" : `Class ${notice.targetClass}`}</p>
                <form action={deleteNotice}>
                  <input type="hidden" name="id" value={notice.id} />
                  <button className="btn-danger">Delete</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="teachers" className="card scroll-mt-24">
        <h3 className="mb-4 text-lg font-semibold">Teachers&apos; Corner Management</h3>
        <form action={createTeacher} className="grid gap-3 md:grid-cols-3">
          <input name="name" className="input-base" placeholder="Teacher name" />
          <input name="designation" className="input-base" placeholder="Designation" />
          <input name="department" className="input-base" placeholder="Department" />
          <input name="photoFile" type="file" accept="image/*" className="input-base" />
          <input name="photoUrl" className="input-base" placeholder="Photo URL (optional)" />
          <input name="email" type="email" className="input-base" placeholder="Email (optional)" />
          <input name="experienceYears" type="number" min={0} className="input-base" placeholder="Experience years" />
          <input name="achievements" className="input-base" placeholder="Achievements (optional)" />
          <textarea
            name="bio"
            className="input-base min-h-24 md:col-span-3"
            placeholder="Portfolio summary"
          />
          <button className="btn-primary w-fit md:col-span-3">Add teacher profile</button>
        </form>

        <ul className="mt-6 space-y-3">
          {teachers.map((teacher) => (
            <li key={teacher.id} className="admin-subcard rounded-xl border border-slate-700/80 bg-slate-900/80 p-4">
              <form action={updateTeacher} className="grid gap-3 md:grid-cols-3">
                <input type="hidden" name="id" value={teacher.id} />
                <input name="name" defaultValue={teacher.name} className="input-base" />
                <input name="designation" defaultValue={teacher.designation} className="input-base" />
                <input name="department" defaultValue={teacher.department} className="input-base" />
                <input name="photoFile" type="file" accept="image/*" className="input-base" />
                <input name="photoUrl" defaultValue={teacher.photoUrl ?? ""} className="input-base" placeholder="Photo URL" />
                <input name="email" type="email" defaultValue={teacher.email ?? ""} className="input-base" />
                <input
                  name="experienceYears"
                  type="number"
                  min={0}
                  defaultValue={teacher.experienceYears ?? ""}
                  className="input-base"
                />
                <input name="achievements" defaultValue={teacher.achievements ?? ""} className="input-base" />
                <textarea name="bio" defaultValue={teacher.bio} className="input-base min-h-24 md:col-span-3" />
                <div className="flex flex-wrap gap-2 md:col-span-3">
                  <button className="btn-primary">Update profile</button>
                </div>
              </form>

              <form action={deleteTeacher} className="mt-3">
                <input type="hidden" name="id" value={teacher.id} />
                <button className="btn-danger">Delete</button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section id="achievements" className="card scroll-mt-24">
        <h3 className="mb-4 text-lg font-semibold">Student Achievements & Memory Wall</h3>
        <form action={createStudentAchievement} className="grid gap-3 md:grid-cols-3">
          <input name="studentName" className="input-base" placeholder="Student name" />
          <input name="exam" defaultValue="Madhyamik" className="input-base" placeholder="Exam" />
          <input name="rank" className="input-base" placeholder="Rank" />
          <input name="passedOutYear" type="number" min={1990} className="input-base" placeholder="Passed-out year" />
          <input name="photoFile" type="file" accept="image/*" className="input-base" />
          <input name="photoUrl" className="input-base" placeholder="Photo URL (optional)" />
          <div></div>
          <textarea name="story" className="input-base min-h-24 md:col-span-3" placeholder="Achievement story" />
          <button className="btn-primary w-fit md:col-span-3">Add achievement</button>
        </form>

        <ul className="mt-6 space-y-3">
          {achievements.map((achievement) => (
            <li key={achievement.id} className="admin-subcard rounded-xl border border-slate-700/80 bg-slate-900/80 p-4">
              <form action={updateStudentAchievement} className="grid gap-3 md:grid-cols-3">
                <input type="hidden" name="id" value={achievement.id} />
                <input name="studentName" defaultValue={achievement.studentName} className="input-base" />
                <input name="exam" defaultValue={achievement.exam} className="input-base" />
                <input name="rank" defaultValue={achievement.rank} className="input-base" />
                <input name="passedOutYear" type="number" min={1990} defaultValue={achievement.passedOutYear} className="input-base" />
                <input name="photoFile" type="file" accept="image/*" className="input-base" />
                <input name="photoUrl" defaultValue={achievement.photoUrl ?? ""} className="input-base" placeholder="Photo URL" />
                <div></div>
                <textarea name="story" defaultValue={achievement.story} className="input-base min-h-24 md:col-span-3" />
                <div className="flex flex-wrap gap-2 md:col-span-3">
                  <button className="btn-primary">Update achievement</button>
                </div>
              </form>
              <form action={deleteStudentAchievement} className="mt-3">
                <input type="hidden" name="id" value={achievement.id} />
                <button className="btn-danger">Delete</button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section id="magazine" className="card scroll-mt-24">
        <h3 className="mb-4 text-lg font-semibold">Magazine Section Management</h3>
        <form action={createMagazinePost} className="grid gap-3 md:grid-cols-3">
          <input name="title" className="input-base" placeholder="Title" />
          <select name="category" className="input-base">
            {magazineCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <input name="author" className="input-base" placeholder="Author (optional)" />
          <textarea name="content" className="input-base min-h-24 md:col-span-3" placeholder="Magazine content" />
          <button className="btn-primary w-fit md:col-span-3">Add magazine post</button>
        </form>

        <ul className="mt-6 space-y-3">
          {magazinePosts.map((post) => (
            <li key={post.id} className="admin-subcard rounded-xl border border-slate-700/80 bg-slate-900/80 p-4">
              <form action={updateMagazinePost} className="grid gap-3 md:grid-cols-3">
                <input type="hidden" name="id" value={post.id} />
                <input name="title" defaultValue={post.title} className="input-base" />
                <select name="category" defaultValue={post.category} className="input-base">
                  {magazineCategoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <input name="author" defaultValue={post.author ?? ""} className="input-base" />
                <textarea name="content" defaultValue={post.content} className="input-base min-h-24 md:col-span-3" />
                <button className="btn-primary w-fit">Update</button>
              </form>
              <form action={deleteMagazinePost} className="mt-3">
                <input type="hidden" name="id" value={post.id} />
                <button className="btn-danger">Delete</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
