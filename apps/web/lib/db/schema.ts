import {
  pgTable,
  pgSchema,
  serial,
  varchar,
  integer,
  boolean,
  timestamp,
  numeric,
  date,
} from "drizzle-orm/pg-core";

// ─── Public Schema ────────────────────────────────────────────────────────────

export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  schoolNumber: varchar("school_number", { length: 20 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  subdomain: varchar("subdomain", { length: 100 }).unique().notNull(),
  region: varchar("region", { length: 100 }),
  district: varchar("district", { length: 100 }),
  schoolType: varchar("school_type", { length: 50 }).default("SHS"),
  plan: varchar("plan", { length: 20 }).default("free"), // free | basic | pro
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  fullName: varchar("full_name", { length: 255 }),
  role: varchar("role", { length: 20 }).default("admin"), // admin | teacher | viewer
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id),
  plan: varchar("plan", { length: 20 }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  amountGhs: numeric("amount_ghs", { precision: 10, scale: 2 }),
  paymentRef: varchar("payment_ref", { length: 100 }),
});

// ─── Tenant Schema Factory ────────────────────────────────────────────────────
// Each school's tables live in schema: tenant_{school_number}
// Call getTenantSchema("0040103") to get schema-bound table references.

export function getTenantSchema(schoolNumber: string) {
  const schema = pgSchema(`tenant_${schoolNumber}`);

  const examSittings = schema.table("exam_sittings", {
    id: serial("id").primaryKey(),
    year: integer("year").notNull(),
    examType: varchar("exam_type", { length: 50 }).default("WASSCE"),
    totalCandidates: integer("total_candidates"),
    sourceFile: varchar("source_file", { length: 255 }),
    parsedAt: timestamp("parsed_at", { withTimezone: true }).defaultNow(),
  });

  const candidates = schema.table("candidates", {
    id: serial("id").primaryKey(),
    sittingId: integer("sitting_id").references(() => examSittings.id, {
      onDelete: "cascade",
    }),
    indexNumber: varchar("index_number", { length: 20 }).notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    gender: varchar("gender", { length: 10 }),
    dateOfBirth: date("date_of_birth"),
    programme: varchar("programme", { length: 50 }), // Science|Business|Arts|Home Econ|Visual Arts
  });

  const results = schema.table("results", {
    id: serial("id").primaryKey(),
    candidateId: integer("candidate_id").references(() => candidates.id, {
      onDelete: "cascade",
    }),
    subject: varchar("subject", { length: 100 }).notNull(),
    grade: varchar("grade", { length: 5 }).notNull(), // A1 B2 B3 C4 C5 C6 D7 E8 F9
    // grade_score is GENERATED ALWAYS AS in the DB; stored as plain int here
    // because Drizzle cannot declare generated columns. Application computes
    // and writes this value on insert.
    gradeScore: integer("grade_score"),
    isCore: boolean("is_core").default(false),
    isElective: boolean("is_elective").default(false),
  });

  const qualificationFlags = schema.table("qualification_flags", {
    candidateId: integer("candidate_id")
      .primaryKey()
      .references(() => candidates.id, { onDelete: "cascade" }),
    qualifiesUniversity: boolean("qualifies_university").default(false),
    qualifiesScience: boolean("qualifies_science").default(false),
    qualifiesBusiness: boolean("qualifies_business").default(false),
    qualifiesArts: boolean("qualifies_arts").default(false),
    qualifiesGeneral: boolean("qualifies_general").default(false),
    corePasses: integer("core_passes").default(0),
    electivePasses: integer("elective_passes").default(0),
    totalPasses: integer("total_passes").default(0),
    bestSixAggregate: integer("best_six_aggregate"),
    computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow(),
  });

  return { examSittings, candidates, results, qualificationFlags };
}

// Type helpers
export type School = typeof schools.$inferSelect;
export type NewSchool = typeof schools.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
