import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const playerLevelEnum = pgEnum("player_level", [
  "beginner",
  "intermediate",
  "advanced",
  "elite",
]);

export const appRoleEnum = pgEnum("app_role", [
  "super_admin",
  "admin",
  "coach",
  "parent",
  "player",
]);

export const sessionTypeEnum = pgEnum("session_type", [
  "class",
  "camp",
  "private",
  "elite",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "pending",
  "parent_confirmed",
  "parent_absent",
  "present",
  "absent",
]);

export const fleetLocationEnum = pgEnum("fleet_location", [
  "atwater",
  "brossard",
]);

export const practiceVenues = pgTable("practice_venues", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  region: text("region").notNull(),
  requiresCar: boolean("requires_car").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appUsers = pgTable("app_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    role: appRoleEnum("role").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_roles_user_id_role_idx").on(table.userId, table.role),
  ],
);

/** Pending staff invites — applied when invitee signs in. */
export const staffInvites = pgTable(
  "staff_invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    role: appRoleEnum("role").notNull(),
    invitedByUserId: uuid("invited_by_user_id").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("staff_invites_email_role_idx").on(table.email, table.role),
  ],
);

/** Parent account → many children. Teenagers may have own login (player) or stay linked. */
export const players = pgTable("players", {
  id: uuid("id").defaultRandom().primaryKey(),
  parentUserId: uuid("parent_user_id").references(() => appUsers.id, {
    onDelete: "set null",
  }),
  playerUserId: uuid("player_user_id").references(() => appUsers.id, {
    onDelete: "set null",
  }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  level: playerLevelEnum("level").notNull(),
  preferredVenueId: uuid("preferred_venue_id").references(
    () => practiceVenues.id,
  ),
  isTeenSelfManaged: boolean("is_teen_self_managed").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Single source of truth — master schedule */
export const scheduleEvents = pgTable("schedule_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: sessionTypeEnum("type").notNull(),
  title: text("title").notNull(),
  venueId: uuid("venue_id")
    .notNull()
    .references(() => practiceVenues.id),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  notes: text("notes"),
  createdByUserId: uuid("created_by_user_id").references(() => appUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scheduleEventCoaches = pgTable("schedule_event_coaches", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => scheduleEvents.id, { onDelete: "cascade" }),
  coachUserId: uuid("coach_user_id")
    .notNull()
    .references(() => appUsers.id),
});

export const scheduleEventPlayers = pgTable("schedule_event_players", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => scheduleEvents.id, { onDelete: "cascade" }),
  playerId: uuid("player_id")
    .notNull()
    .references(() => players.id),
});

/** Per-practice roster — who was present (replaces texting lists) */
export const attendanceRecords = pgTable("attendance_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => scheduleEvents.id, { onDelete: "cascade" }),
  playerId: uuid("player_id")
    .notNull()
    .references(() => players.id),
  status: attendanceStatusEnum("status").default("pending").notNull(),
  parentConfirmedAt: timestamp("parent_confirmed_at"),
  coachFinalizedAt: timestamp("coach_finalized_at"),
  coachFinalizedByUserId: uuid("coach_finalized_by_user_id").references(
    () => appUsers.id,
  ),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fleetVehicles = pgTable("fleet_vehicles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  currentLocation: fleetLocationEnum("current_location").notNull(),
  isCharged: boolean("is_charged").default(true).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notices = pgTable("notices", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  bodyEn: text("body_en").notNull(),
  bodyZh: text("body_zh"),
  bodyFr: text("body_fr"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
