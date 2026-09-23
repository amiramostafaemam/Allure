// backend/src/db/schema.ts
import { pgTable, serial, text, timestamp , integer , uuid , boolean , jsonb, index, unique} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// "pending"/"failed" are currently unreachable: fulfillCheckoutSession() in
// webhooks/polar.ts always inserts new orders with status "paid" — nothing
// in this codebase ever produces "pending" or "failed" today.
export type OrderStatus =
  | "pending"
  | "paid"
  | "failed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
export type UserRole = "admin" | "customer" | "support";
export type CheckoutSessionLine = {
  productId: string;
  quantity: number;
  unitPricePounds: number;
};
export type ShippingAddress = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  governorate: string;
  country: string;
};

export const users = pgTable("users",{
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    email: text("email").notNull().default(""),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    role: text("role").$type<UserRole>().notNull().default("customer"),
    createdAt: timestamp("created_at",{withTimezone: true}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at",{withTimezone: true}).defaultNow().notNull(),
})

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull().default("General"),
  description: text("description").notNull().default(""),
  pricePounds: integer("price_pounds").notNull(),
  currency: text("currency").notNull().default("egp"),
  imageUrl: text("image_url"),
  /** ImageKit `fileId` for deletes */
  imageKitFileId: text("image_kit_file_id"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("products_category_idx").on(table.category),
]);

// Managed list of valid category names. Not a FK from `products` (that would
// need backfilling every existing free-text value) — kept in sync instead by
// validating `products.category` against this table server-side on write,
// and bulk-updating matching product rows when a category is renamed.
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique("reviews_product_user_unique").on(table.productId, table.userId),
]);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));

export const wishlistItems = pgTable("wishlist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique("wishlist_items_user_product_unique").on(table.userId, table.productId),
]);

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  product: one(products, { fields: [wishlistItems.productId], references: [products.id] }),
  user: one(users, { fields: [wishlistItems.userId], references: [users.id] }),
}));

export const checkoutSessions = pgTable("checkout_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  polarCheckoutId: text("polar_checkout_id").unique(),
  lines: jsonb("lines").$type<CheckoutSessionLine[]>().notNull(),
  totalPounds: integer("total_pounds").notNull(),
  currency: text("currency").notNull(),
  shippingAddress: jsonb("shipping_address").$type<ShippingAddress>(),
  promoCode: text("promo_code"),
  discountPounds: integer("discount_pounds").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
// casasecade means : "delete the checkout session if the user is deleted" delete children when parent is deleted. restrict means :"don't delete the parent if any child still associated with it" prevent deletion of parent if children exist.

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  unitPricePounds: integer("unit_price_Pounds").notNull(),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Short, human-friendly display number (e.g. "#1001" = 1000 + orderNumber)
  // — the uuid `id` above stays the real primary key / foreign key
  // everywhere (Stream channel ids, joins, etc.), this is display-only.
  orderNumber: integer("order_number").generatedAlwaysAsIdentity().notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").$type<OrderStatus>().notNull().default("pending"),
  polarCheckoutId: text("polar_checkout_id"),
  polarOrderId: text("polar_order_id").unique(),
  totalPounds: integer("total_pounds").notNull().default(0),
  shippingAddress: jsonb("shipping_address").$type<ShippingAddress>(),
  promoCode: text("promo_code"),
  discountPounds: integer("discount_pounds").notNull().default(0),
  // Customer-initiated cancellation/refund request, cleared whenever the
  // order's status is next changed (approved or not).
  requestedStatus: text("requested_status").$type<OrderStatus>(),
  requestedNote: text("requested_note"),
  requestedAt: timestamp("requested_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Audit trail for manual admin status changes (PATCH /api/admin/orders/:id/status).
// Written in the same transaction as the orders.status update.
export const orderStatusEvents = pgTable("order_status_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  fromStatus: text("from_status").$type<OrderStatus>().notNull(),
  toStatus: text("to_status").$type<OrderStatus>().notNull(),
  note: text("note"),
  changedByUserId: uuid("changed_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Percentage-off codes applied at checkout (backend/src/controllers/checkoutController.ts).
export const promoCodes = pgTable("promo_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(), // stored uppercase, matched case-insensitively
  percentOff: integer("percent_off").notNull(), // 1-100
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// a user can have many orders over time.
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

// the same product can show up on many order lines and have many reviews
export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  reviews: many(reviews),
  wishlistItems: many(wishlistItems),
}));

// each order belongs to exactly one user; each order can have many line items
// and many manual status-change events.
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
  statusEvents: many(orderStatusEvents),
}));

// each line item is for exactly one order and one product
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

// each status event belongs to exactly one order, and optionally the admin who made it
export const orderStatusEventsRelations = relations(orderStatusEvents, ({ one }) => ({
  order: one(orders, { fields: [orderStatusEvents.orderId], references: [orders.id] }),
  changedBy: one(users, { fields: [orderStatusEvents.changedByUserId], references: [users.id] }),
}));

// In-app alerts. Populated by two sources: the Stream Chat webhook
// (webhooks/stream.ts) on message.new (customer messages notify every
// staff/admin, staff messages notify that order's customer), and manual
// status changes (controllers/orderController.ts, updateOrderStatus)
// notifying the customer directly.
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  // Stream can (and does) redeliver the same message.new webhook event more
  // than once for a single chat message. Recording which message a
  // notification came from lets the webhook handler skip a redelivery
  // instead of inserting a duplicate row per recipient.
  streamMessageId: text("stream_message_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("notifications_user_id_idx").on(table.userId),
  unique("notifications_user_stream_message_unique").on(table.userId, table.streamMessageId),
]);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  order: one(orders, { fields: [notifications.orderId], references: [orders.id] }),
}));