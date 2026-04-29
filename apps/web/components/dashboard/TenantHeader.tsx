import { getSchoolBySubdomain } from "@/lib/db/tenant";

interface Props {
  subdomain: string;
}

export async function TenantHeader({ subdomain }: Props) {
  const school = await getSchoolBySubdomain(subdomain).catch(() => null);

  return (
    <div>
      <h1 className="text-lg font-semibold">
        {school?.name ?? subdomain.toUpperCase()}
      </h1>
      <p className="text-xs text-muted-foreground">
        {subdomain}.wassce-analytics.com
      </p>
    </div>
  );
}
