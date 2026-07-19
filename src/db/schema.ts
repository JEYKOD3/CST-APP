import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const playerLevelEnum = pgEnum("player_level", [
  "beginner",
  "intermediate",
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
  (table) => [unique("user_roles_user_id_role_unique").on(table.userId, table.role)],
);

/** Pre-assigned roles before first sign-in (super admin invites). */
export const pendingRoleAssignments = pgTable("pending_role_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  role: appRoleEnum("role").notNull(),
  invitedByUserId: uuid("invited_by_user_id").references(() => appUsers.id, {
    onDelete: "set null",
  }),
  clerkInvitationId: text("clerk_invitation_id"),
  fulfilledAt: timestamp("fulfilled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Parent account → many children. Teenagers may have own login (player) or stay linked. */
export const players = pgTable(
  "players",
  {
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
  },
  (table) => [
    index("players_parent_user_id_idx").on(table.parentUserId),
    index("players_player_user_id_idx").on(table.playerUserId),
  ],
);

/** A multi-month period (e.g. Summer 2026) that groups recurring practices. */
export const seasons = pgTable("seasons", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  active: boolean("active").default(true).notNull(),
  createdByUserId: uuid("created_by_user_id").references(() => appUsers.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Recurrence rule: a weekly practice slot for a season (venue + level + weekday
 * + wall-clock time). Concrete dated occurrences are materialized into
 * `schedule_events`, each linked back via `seriesId`.
 */
export const practiceSeries = pgTable(
  "practice_series",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    seasonId: uuid("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => practiceVenues.id),
    type: sessionTypeEnum("type").default("class").notNull(),
    level: playerLevelEnum("level"), // null = all levels
    title: text("title").notNull(),
    dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday .. 6=Saturday
    startTime: text("start_time").notNull(), // "HH:MM" wall-clock at the venue
    endTime: text("end_time").notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    notes: text("notes"),
    active: boolean("active").default(true).notNull(),
    createdByUserId: uuid("created_by_user_id").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("practice_series_season_idx").on(table.seasonId),
    index("practice_series_venue_idx").on(table.venueId),
  ],
);

/** Single source of truth — master schedule (concrete dated practices). */
export const scheduleEvents = pgTable(
  "schedule_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: sessionTypeEnum("type").notNull(),
    title: text("title").notNull(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => practiceVenues.id),
    level: playerLevelEnum("level"), // null = all levels
    seriesId: uuid("series_id").references(() => practiceSeries.id, {
      onDelete: "set null",
    }),
    startsAt: timestamp("starts_at").notNull(),
    endsAt: timestamp("ends_at").notNull(),
    canceled: boolean("canceled").default(false).notNull(),
    notes: text("notes"),
    createdByUserId: uuid("created_by_user_id").references(() => appUsers.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("schedule_events_starts_at_idx").on(table.startsAt),
    index("schedule_events_ends_at_idx").on(table.endsAt),
    index("schedule_events_series_idx").on(table.seriesId),
    index("schedule_events_venue_starts_idx").on(table.venueId, table.startsAt),
  ],
);

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
export const attendanceRecords = pgTable(
  "attendance_records",
  {
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
  },
  (table) => [
    // One record per (practice, player) — enables upsert + fast per-event roster reads.
    uniqueIndex("attendance_event_player_idx").on(
      table.eventId,
      table.playerId,
    ),
    // Parent overview: look up a player's records across upcoming events.
    index("attendance_player_idx").on(table.playerId),
  ],
);

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

export const notificationTypeEnum = pgEnum("notification_type", [
  "practice_created",
  "practice_updated",
  "practice_canceled",
  "coach_assigned",
  "general",
]);

/** In-app notifications — schedule changes, coach assignments (replaces texts). */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").default("general").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    relatedEventId: uuid("related_event_id").references(
      () => scheduleEvents.id,
      { onDelete: "cascade" },
    ),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
    index("notifications_user_unread_idx").on(table.userId, table.readAt),
  ],
);

export const registrationStatusEnum = pgEnum("registration_status", [
  "pending_review",
  "approved",
  "rejected",
]);

/** Summer registration + e-transfer proof — manual admin approval (Sprint 2). */
export const registrations = pgTable("registrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  playerId: uuid("player_id")
    .notNull()
    .references(() => players.id),
  parentUserId: uuid("parent_user_id")
    .notNull()
    .references(() => appUsers.id),
  season: text("season").notNull(),
  status: registrationStatusEnum("status").default("pending_review").notNull(),
  eTransferReference: text("e_transfer_reference").notNull(),
  proofUrl: text("proof_url"),
  proofFileName: text("proof_file_name"),
  parentNotes: text("parent_notes"),
  reviewedByUserId: uuid("reviewed_by_user_id").references(() => appUsers.id, {
    onDelete: "set null",
  }),
  reviewedAt: timestamp("reviewed_at"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
