export const pageSlugOptions = [
  { value: "home", label: "Home" },
  { value: "about", label: "About" },
  { value: "admissions", label: "Admissions" },
  { value: "academics", label: "Academics" },
  { value: "teachers", label: "Teachers" },
  { value: "achievements", label: "Achievements" },
  { value: "events", label: "Events" },
  { value: "notices", label: "Notices" },
  { value: "magazine", label: "Magazine" },
  { value: "contact", label: "Contact" },
] as const;

export const blockTypeOptions = [
  { value: "TEXT", label: "Text Box" },
  { value: "IMAGE", label: "Image Box" },
  { value: "LIST", label: "Lined/List Box" },
] as const;

export const noticeClassOptions = [
  { value: "ALL", label: "All Classes" },
  { value: "5", label: "Class 5" },
  { value: "6", label: "Class 6" },
  { value: "7", label: "Class 7" },
  { value: "8", label: "Class 8" },
  { value: "9", label: "Class 9" },
  { value: "10", label: "Class 10" },
] as const;

export const magazineCategoryOptions = [
  { value: "quote", label: "Quote" },
  { value: "poem", label: "Poem" },
  { value: "story", label: "Story" },
] as const;
