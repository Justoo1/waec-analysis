export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background">
      <main className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          WAEC Analytics
        </h1>
        <p className="max-w-sm text-base text-foreground/60">
          Insights and performance data for WAEC examinations.
        </p>
      </main>
    </div>
  );
}
