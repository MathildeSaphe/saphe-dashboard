export default function MinArbejdsdag() {
  const now = new Date();
  const greeting = getGreeting(now);
  const dateStr = now.toLocaleDateString("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
        <h1 className="text-2xl font-semibold text-foreground mt-0.5">
          {greeting}
        </h1>
      </div>

      {/* Placeholder kort */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PlaceholderCard
          title="Dagens mål"
          description="Dine mål for dagen vises her"
          color="saphe"
        />
        <PlaceholderCard
          title="Opgaver fra Monday"
          description="Dine prioriterede Monday-opgaver"
          color="gray"
        />
        <PlaceholderCard
          title="Kalender i dag"
          description="Dine møder og aftaler fra Outlook"
          color="gray"
        />
        <PlaceholderCard
          title="Ulæste mails"
          description="Vigtige mails fra Outlook"
          color="gray"
        />
      </div>

      <div className="rounded-lg border border-border bg-accent/30 px-5 py-4">
        <p className="text-sm font-medium text-foreground">
          Hvad skal du fokusere på nu?
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Integrationer med Monday og Outlook sættes op i næste etape.
        </p>
      </div>
    </div>
  );
}

function PlaceholderCard({
  title,
  description,
  color,
}: {
  title: string;
  description: string;
  color: "saphe" | "gray";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-2">
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${
            color === "saphe" ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        />
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function getGreeting(date: Date) {
  const hour = date.getHours();
  if (hour < 10) return "God morgen, Mathilde 👋";
  if (hour < 13) return "Klar til en stærk dag, Mathilde?";
  if (hour < 17) return "Hvad er næste skridt, Mathilde?";
  return "Dagens afslutning, Mathilde";
}
