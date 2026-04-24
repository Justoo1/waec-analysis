"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const schema = z.object({
  schoolName: z.string().min(2, "School name required"),
  schoolNumber: z.string().min(7, "Enter your 7-digit school number"),
  subdomain: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    // TODO: call /api/schools/register once implemented
    console.log("Register:", data);
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Register your school</h1>
          <p className="text-sm text-muted-foreground">
            Set up your WAEC Analytics account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {(
            [
              ["schoolName", "School Name", "text"],
              ["schoolNumber", "School Number (e.g. 0040103)", "text"],
              ["subdomain", "Subdomain (e.g. apgss)", "text"],
              ["fullName", "Your Full Name", "text"],
              ["email", "Admin Email", "email"],
              ["password", "Password", "password"],
            ] as const
          ).map(([field, label, type]) => (
            <div key={field} className="space-y-1">
              <label className="text-sm font-medium" htmlFor={field}>
                {label}
              </label>
              <input
                id={field}
                type={type}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                {...register(field)}
              />
              {errors[field] && (
                <p className="text-xs text-destructive">
                  {errors[field]?.message}
                </p>
              )}
            </div>
          ))}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
