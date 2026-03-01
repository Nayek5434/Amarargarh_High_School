import { prisma } from "@/lib/prisma";

const globalForDefaults = globalThis as typeof globalThis & {
  ensureDefaultsPromise?: Promise<void>;
};

const defaultPages = [
  {
    slug: "about",
    title: "About Our School",
    content:
      "Welcome to Amarargarh High School. We combine academic excellence, discipline, and character-building to prepare learners for higher education and responsible citizenship. Our campus culture focuses on values, curiosity, and confidence.",
  },
  {
    slug: "admissions",
    title: "Admissions",
    content:
      "Admissions open every academic session for primary to senior classes. Parents are requested to visit the school office with student identification records, previous report cards, transfer certificate (if applicable), and passport-size photographs.",
  },
  {
    slug: "academics",
    title: "Academics",
    content:
      "Our academic framework balances conceptual understanding, practical application, and assessment readiness. The school follows structured yearly plans, continuous evaluation, remedial support, and co-curricular integration to ensure comprehensive student progress.",
  },
  {
    slug: "contact",
    title: "Contact",
    content:
      "Reach us during school hours for admissions, academic counseling, examination support, and administrative assistance. Parents can connect through office phone or email for timely updates and grievance redressal.",
  },
];

const defaultTeachers = [
  {
    name: "Teacher1",
    designation: "Senior Science Faculty",
    department: "Science",
    bio: "Leads experiential science instruction with project-based pedagogy and board-exam mentorship.",
    photoUrl: "/images/teachers/teacher1.svg",
    experienceYears: 12,
    email: "teacher1@amarargarhschool.edu.in",
    achievements: "District Science Fair Mentor Award (2024)",
  },
  {
    name: "Teacher2",
    designation: "Mathematics Department Coordinator",
    department: "Mathematics",
    bio: "Builds strong conceptual foundations in arithmetic, algebra, and competitive problem solving.",
    photoUrl: "/images/teachers/teacher2.svg",
    experienceYears: 10,
    email: "teacher2@amarargarhschool.edu.in",
    achievements: "State-level Olympiad Coaching Recognition",
  },
  {
    name: "Teacher3",
    designation: "Language & Communication Mentor",
    department: "English",
    bio: "Focuses on reading comprehension, spoken communication, and critical writing for senior classes.",
    photoUrl: "/images/teachers/teacher3.svg",
    experienceYears: 9,
    email: "teacher3@amarargarhschool.edu.in",
    achievements: "Best Language Lab Initiative (2025)",
  },
];

const defaultStudentAchievements = [
  {
    studentName: "Student1",
    exam: "Madhyamik",
    rank: "District Rank 8",
    passedOutYear: 2024,
    story:
      "Student1 secured top district rank in Madhyamik and received recognition for consistent science and mathematics performance.",
    photoUrl: "/images/students/student1.svg",
  },
  {
    studentName: "Student2",
    exam: "Madhyamik",
    rank: "District Rank 15",
    passedOutYear: 2023,
    story:
      "Student2 achieved an outstanding result in Madhyamik with distinction in language papers and social science.",
    photoUrl: "/images/students/student2.svg",
  },
  {
    studentName: "Student3",
    exam: "Madhyamik",
    rank: "Block Topper",
    passedOutYear: 2022,
    story:
      "Student3 became the block topper and is remembered for leadership in debate and academic excellence.",
    photoUrl: "/images/students/student3.svg",
  },
];

const defaultMagazinePosts = [
  {
    title: "Dream Beyond Marks",
    category: "quote",
    content:
      "Education is not only about scoring marks; it is about building the courage to think, create, and serve society with integrity.",
    author: "School Editorial Club",
  },
  {
    title: "Morning Assembly",
    category: "poem",
    content:
      "In morning light we stand as one,\nWith hopeful hearts to greet the sun.\nThrough books and values side by side,\nIn truth and effort we take pride.",
    author: "Literary Cell",
  },
  {
    title: "The Library Lamp",
    category: "story",
    content:
      "A student once stayed late with a difficult chapter. A teacher quietly placed a lamp beside the desk and said, 'Every page you read today becomes confidence tomorrow.'",
    author: "Magazine Team",
  },
];

const defaultImportantBoxes = [
  {
    pageSlug: "home",
    blockType: "TEXT",
    sortOrder: 0,
    title: "Admission Helpdesk Open",
    content:
      "For Class 5 to 10 admission guidance, visit the school office between 10 AM and 3 PM on working days.",
    imageUrl: null,
    lineItems: null,
    isActive: true,
  },
  {
    pageSlug: "about",
    blockType: "LIST",
    sortOrder: 1,
    title: "Core Values",
    content: "",
    imageUrl: null,
    lineItems: "Discipline\nRespect\nIntegrity\nScientific curiosity",
    isActive: true,
  },
];

const defaultEvents = [
  {
    title: "Annual Sports Meet",
    description: "Inter-house track and field events with parent participation and prize distribution.",
    eventDate: new Date("2026-03-20T10:00:00+05:30"),
  },
  {
    title: "Science Exhibition",
    description: "Student model showcase from Classes 7-10 with jury interaction and awards.",
    eventDate: new Date("2026-04-10T11:00:00+05:30"),
  },
  {
    title: "Parent-Teacher Meeting",
    description: "Academic progress discussion and guidance session for parents and guardians.",
    eventDate: new Date("2026-04-25T09:30:00+05:30"),
  },
];

const defaultNotices = [
  {
    title: "New Session Admission Window",
    content: "Admissions for the new session are open. Please submit required documents at the school office.",
    targetClass: "ALL",
  },
  {
    title: "Class 10 Test Schedule",
    content: "Pre-board test routine for Class 10 has been published. Collect timetable from class teacher.",
    targetClass: "10",
  },
  {
    title: "Library Renewal Drive",
    content: "Students are requested to renew library cards by next Friday during school office hours.",
    targetClass: "ALL",
  },
];

async function seedDefaults() {
  const siteSettings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      schoolName: "Amarargarh High School",
      tagline: "Learning, Discipline, Excellence",
      address: "Amarargarh, India",
      phone: "+91-00000-00000",
      email: "school@example.com",
      principalMessage:
        "We believe every child has potential. Our mission is to nurture confidence, values, and curiosity.",
    },
  });

  if (siteSettings.schoolName.trim() === "Amarargarh School") {
    await prisma.siteSettings.update({
      where: { id: 1 },
      data: { schoolName: "Amarargarh High School" },
    });
  }

  for (const page of defaultPages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
  }

  const teacherCount = await prisma.teacher.count();
  if (teacherCount === 0) {
    await prisma.teacher.createMany({ data: defaultTeachers });
  }

  const achievementCount = await prisma.studentAchievement.count();
  if (achievementCount === 0) {
    await prisma.studentAchievement.createMany({ data: defaultStudentAchievements });
  }

  const magazineCount = await prisma.magazinePost.count();
  if (magazineCount === 0) {
    await prisma.magazinePost.createMany({ data: defaultMagazinePosts });
  }

  const importantBoxCount = await prisma.importantBox.count();
  if (importantBoxCount === 0) {
    await prisma.importantBox.createMany({ data: defaultImportantBoxes });
  }

  const eventCount = await prisma.event.count();
  if (eventCount === 0) {
    await prisma.event.createMany({ data: defaultEvents });
  }

  const noticeCount = await prisma.notice.count();
  if (noticeCount === 0) {
    await prisma.notice.createMany({ data: defaultNotices });
  }
}

function shouldRunRuntimeSeeding() {
  const explicit = process.env.ENABLE_RUNTIME_SEEDING?.trim().toLowerCase();
  if (explicit === "true") {
    return true;
  }
  if (explicit === "false") {
    return false;
  }
  return process.env.NODE_ENV !== "production";
}

export async function ensureDefaults() {
  if (!shouldRunRuntimeSeeding()) {
    return;
  }

  if (!globalForDefaults.ensureDefaultsPromise) {
    globalForDefaults.ensureDefaultsPromise = seedDefaults().catch((error) => {
      globalForDefaults.ensureDefaultsPromise = undefined;
      throw error;
    });
  }

  await globalForDefaults.ensureDefaultsPromise;
}
