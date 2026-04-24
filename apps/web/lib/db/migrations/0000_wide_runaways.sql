CREATE TABLE "schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_number" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"subdomain" varchar(100) NOT NULL,
	"region" varchar(100),
	"district" varchar(100),
	"school_type" varchar(50) DEFAULT 'SHS',
	"plan" varchar(20) DEFAULT 'free',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "schools_school_number_unique" UNIQUE("school_number"),
	CONSTRAINT "schools_subdomain_unique" UNIQUE("subdomain")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer,
	"plan" varchar(20) NOT NULL,
	"started_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone,
	"amount_ghs" numeric(10, 2),
	"payment_ref" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"full_name" varchar(255),
	"role" varchar(20) DEFAULT 'admin',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;