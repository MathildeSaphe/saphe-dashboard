export default function Chatbot() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Chatbot</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Chat med Claude – din AI-assistent med Saphe-kontekst
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
        <p className="text-muted-foreground text-sm">
          Chatbot-funktionen bygges i Etape 3 (kræver Anthropic API-nøgle)
        </p>
      </div>
    </div>
  );
}
