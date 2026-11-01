export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 px-4 py-12">
      <h1 className="text-3xl font-semibold text-balance">OpenPulpit</h1>
      <p className="text-muted-foreground text-pretty">
        Preachers go live with audio from their phone. Listeners follow, listen
        live and replay sermons, using very little data.
      </p>
    </main>
  );
}
