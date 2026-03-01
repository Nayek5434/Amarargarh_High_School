export type DynamicBlock = {
  id: number;
  pageSlug: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: Date;
  blockType: "TEXT" | "IMAGE" | "LIST";
  sortOrder: number;
  imageUrl: string | null;
  lineItems: string | null;
};

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asDate(value: unknown) {
  return value instanceof Date ? value : new Date(0);
}

export function normalizeDynamicBlock(record: unknown): DynamicBlock {
  const input = record as Partial<Record<keyof DynamicBlock, unknown>>;
  const rawType = asString(input.blockType, "TEXT").toUpperCase();
  const blockType = rawType === "IMAGE" || rawType === "LIST" ? rawType : "TEXT";

  return {
    id: asNumber(input.id, 0),
    pageSlug: asString(input.pageSlug, "home"),
    title: asString(input.title),
    content: asString(input.content),
    isActive: Boolean(input.isActive),
    createdAt: asDate(input.createdAt),
    blockType,
    sortOrder: asNumber(input.sortOrder, 0),
    imageUrl: input.imageUrl == null ? null : asString(input.imageUrl),
    lineItems: input.lineItems == null ? null : asString(input.lineItems),
  };
}

export function sortDynamicBlocks(blocks: DynamicBlock[]) {
  return [...blocks].sort((left, right) => {
    const pageCompare = left.pageSlug.localeCompare(right.pageSlug);
    if (pageCompare !== 0) {
      return pageCompare;
    }

    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });
}

export function sortDynamicBlocksForPage(blocks: DynamicBlock[]) {
  return [...blocks].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });
}
