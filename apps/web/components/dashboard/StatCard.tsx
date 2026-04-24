interface Props {
  title: string;
  value: string | number;
  description?: string;
}

export function StatCard({ title, value, description }: Props) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
