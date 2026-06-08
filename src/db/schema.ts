import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  bigserial
} from "drizzle-orm/pg-core";

export const orderStatusEnum = pgEnum("order_status", [
  "QUOTE_CREATED",
  "PAYMENT_VERIFICATION_PENDING",
  "PAID",
  "PRINTING",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "PAYMENT_REJECTED"
]);

export const paperSizeEnum = pgEnum("paper_size", ["A4", "A3"]);
export const bindingEnum = pgEnum("binding", ["NONE", "SPIRAL"]);

export const shops = pgTable("shops", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  upiId: text("upi_id").notNull(),
  email: text("email"),
  shopkeeperName: text("shopkeeper_name"),
  bwPriceA4: numeric("bw_price_a4", { precision: 10, scale: 2 }).notNull().default("2.00"),
  bwPriceA3: numeric("bw_price_a3", { precision: 10, scale: 2 }).notNull().default("4.00"),
  colorPriceA4: numeric("color_price_a4", { precision: 10, scale: 2 }).notNull().default("10.00"),
  colorPriceA3: numeric("color_price_a3", { precision: 10, scale: 2 }).notNull().default("20.00"),
  spiralBindingPrice: numeric("spiral_binding_price", { precision: 10, scale: 2 }).notNull().default("40.00"),
  laminationPrice: numeric("lamination_price", { precision: 10, scale: 2 }).notNull().default("30.00"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey(),
  shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("SHOPKEEPER"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "restrict" }).notNull(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email"),
    trackingTokenHash: text("tracking_token_hash").notNull().unique(),
    trackingTokenPrefix: text("tracking_token_prefix").notNull().default(''),
    orderNumber: bigserial("order_number", { mode: "number" }).notNull().unique(),
    status: orderStatusEnum("status").notNull().default("QUOTE_CREATED"),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
    quote: jsonb("quote").$type<QuoteSnapshot>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    statusIdx: index("orders_status_idx").on(table.status),
    createdAtIdx: index("orders_created_at_idx").on(table.createdAt),
    tokenIdx: index("orders_tracking_token_hash_idx").on(table.trackingTokenHash),
    shopIdx: index("orders_shop_id_idx").on(table.shopId)
  })
);

export const files = pgTable(
  "files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
    originalName: text("original_name").notNull(),
    storagePath: text("storage_path").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    pageCount: integer("page_count"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true })
  },
  (table) => ({
    orderIdx: index("files_order_id_idx").on(table.orderId)
  })
);

export const fileOptions = pgTable("file_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  fileId: uuid("file_id").references(() => files.id, { onDelete: "cascade" }).notNull().unique(),
  paperSize: paperSizeEnum("paper_size").notNull(),
  copies: integer("copies").notNull(),
  binding: bindingEnum("binding").notNull(),
  lamination: boolean("lamination").notNull(),
  entireDocumentColor: boolean("entire_document_color").notNull(),
  colorPageRanges: text("color_page_ranges"),
  totalPages: integer("total_pages").notNull(),
  colorPages: integer("color_pages").notNull(),
  bwPages: integer("bw_pages").notNull()
});

export const statusHistory = pgTable(
  "status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
    fromStatus: orderStatusEnum("from_status"),
    toStatus: orderStatusEnum("to_status").notNull(),
    note: text("note"),
    actorId: uuid("actor_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    orderIdx: index("status_history_order_id_idx").on(table.orderId)
  })
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
    provider: text("provider").notNull(),
    providerOrderId: text("provider_order_id"),
    providerTransactionId: text("provider_transaction_id"),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    orderIdx: index("payments_order_id_idx").on(table.orderId)
  })
);

export type QuoteSnapshot = {
  bwCost: number;
  colorCost: number;
  bindingCost: number;
  laminationCost: number;
  total: number;
  currency: "INR";
  lineItems: Array<{ label: string; amount: number }>;
};

export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
