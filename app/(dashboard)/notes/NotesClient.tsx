"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";

type Note = {
  id: string;
  date: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
};

function todayId() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatShort(iso: string) {
  return new Date(iso).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "short",
  });
}

export default function NotesClient() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string>(todayId());
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pdfs, setPdfs] = useState<string[]>([]);
  const [openPdf, setOpenPdf] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  const triggerSave = useCallback(
    (nextTitle: string, nextContent: string, nextTags: string[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaved(false);
      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: activeIdRef.current,
            title: nextTitle,
            content: nextContent,
            tags: nextTags,
          }),
        });
        const updated: Note[] = await fetch("/api/notes").then((r) => r.json());
        setNotes(updated);
        setSaving(false);
        setSaved(true);
      }, 1000);
    },
    []
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: "Skriv din note her…" }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-7 py-4 text-sm leading-relaxed text-foreground",
      },
    },
    onUpdate({ editor }) {
      triggerSave(title, editor.getHTML(), tags);
    },
  });

  // Indlæs noter
  useEffect(() => {
    fetch("/api/notes")
      .then((r) => r.json())
      .then((data: Note[]) => {
        setNotes(data);
        const today = data.find((n) => n.id === todayId());
        if (today && editor) {
          setTitle(today.title);
          editor.commands.setContent(today.content || "");
          setTags(today.tags);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Indlæs PDF-filer for aktiv note
  useEffect(() => {
    fetch(`/api/notes/upload?noteId=${activeId}`)
      .then((r) => r.json())
      .then(setPdfs);
    setOpenPdf(null);
  }, [activeId]);

  function selectNote(note: Note) {
    setActiveId(note.id);
    setTitle(note.title);
    editor?.commands.setContent(note.content || "");
    setTags(note.tags);
    setSaved(false);
  }

  function newNote() {
    const id = todayId();
    setActiveId(id);
    const existing = notes.find((n) => n.id === id);
    setTitle(existing?.title ?? "");
    editor?.commands.setContent(existing?.content ?? "");
    setTags(existing?.tags ?? []);
    setSaved(false);
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    triggerSave(val, editor?.getHTML() ?? "", tags);
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const next = [...tags, tagInput.trim()];
      setTags(next);
      setTagInput("");
      triggerSave(title, editor?.getHTML() ?? "", next);
    }
  }

  function removeTag(tag: string) {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    triggerSave(title, editor?.getHTML() ?? "", next);
  }

  async function deleteNote(id: string) {
    await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
    const updated: Note[] = await fetch("/api/notes").then((r) => r.json());
    setNotes(updated);
    newNote();
  }

  async function uploadPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("noteId", activeIdRef.current);
    await fetch("/api/notes/upload", { method: "POST", body: fd });
    const updated: string[] = await fetch(
      `/api/notes/upload?noteId=${activeIdRef.current}`
    ).then((r) => r.json());
    setPdfs(updated);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function deletePdf(filename: string) {
    await fetch(
      `/api/notes/upload?noteId=${activeId}&filename=${encodeURIComponent(filename)}`,
      { method: "DELETE" }
    );
    setPdfs((prev) => prev.filter((f) => f !== filename));
    if (openPdf === filename) setOpenPdf(null);
  }

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const isToday = activeId === todayId();

  return (
    <>
      {/* Tiptap CSS */}
      <style>{`
        .tiptap p { margin: 0 0 0.5em; }
        .tiptap h1 { font-size: 1.5rem; font-weight: 700; margin: 0.75em 0 0.25em; }
        .tiptap h2 { font-size: 1.2rem; font-weight: 600; margin: 0.75em 0 0.25em; }
        .tiptap ul { list-style: disc; padding-left: 1.4em; margin: 0.25em 0; }
        .tiptap ol { list-style: decimal; padding-left: 1.4em; margin: 0.25em 0; }
        .tiptap blockquote { border-left: 3px solid #e5e7eb; padding-left: 1em; color: #6b7280; margin: 0.5em 0; }
        .tiptap strong { font-weight: 700; }
        .tiptap em { font-style: italic; }
        .tiptap u { text-decoration: underline; }
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          float: left;
          height: 0;
        }
      `}</style>

      <div className="flex gap-6" style={{ height: "calc(100vh - 8rem)" }}>

        {/* Venstre – noteliste */}
        <div className="w-60 shrink-0 flex flex-col gap-3">
          <input
            type="text"
            placeholder="Søg i noter…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={newNote}
            className="w-full rounded-xl bg-primary text-primary-foreground text-sm font-medium py-2.5 hover:bg-primary/90 transition-colors"
          >
            + Ny note
          </button>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 pt-2">Ingen noter endnu</p>
            )}
            {filtered.map((note) => (
              <button
                key={note.id}
                onClick={() => selectNote(note)}
                className={`w-full text-left rounded-xl px-4 py-3 transition-colors ${
                  note.id === activeId
                    ? "bg-white border border-primary/30 shadow-sm"
                    : "bg-white border border-border hover:border-primary/20"
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <p className={`text-sm font-medium truncate ${note.id === activeId ? "text-primary" : "text-foreground"}`}>
                    {note.title || "Unavngivet note"}
                  </p>
                  <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                    {formatShort(note.updatedAt)}
                  </span>
                </div>
                {note.content && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {note.content.replace(/<[^>]+>/g, "").slice(0, 55)}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Højre – editor */}
        <div className="flex-1 flex flex-col rounded-2xl bg-white border border-border overflow-hidden">

          {/* Editor-header */}
          <div className="flex items-center justify-between px-7 py-3.5 border-b border-border shrink-0">
            <p className="text-xs text-muted-foreground capitalize">
              {isToday ? "I dag · " : ""}{formatDate(activeId)}
            </p>
            <div className="flex items-center gap-4">
              {saving && <span className="text-xs text-muted-foreground">Gemmer…</span>}
              {saved && !saving && <span className="text-xs text-primary font-medium">✓ Gemt</span>}
              <button
                onClick={() => deleteNote(activeId)}
                className="text-xs text-muted-foreground/50 hover:text-destructive transition-colors"
              >
                Slet note
              </button>
            </div>
          </div>

          {/* Titel */}
          <input
            type="text"
            placeholder="Titel…"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-7 pt-5 pb-1 text-2xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none bg-transparent shrink-0"
          />

          {/* Værktøjslinje */}
          <div className="flex items-center gap-0.5 px-6 py-2 border-b border-border shrink-0">
            <ToolBtn
              active={editor?.isActive("bold") ?? false}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              title="Fed (Cmd+B)"
            >
              <strong>B</strong>
            </ToolBtn>
            <ToolBtn
              active={editor?.isActive("italic") ?? false}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              title="Kursiv (Cmd+I)"
            >
              <em>I</em>
            </ToolBtn>
            <ToolBtn
              active={editor?.isActive("underline") ?? false}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              title="Understreg (Cmd+U)"
            >
              <span className="underline">U</span>
            </ToolBtn>
            <div className="w-px h-4 bg-border mx-1" />
            <ToolBtn
              active={editor?.isActive("heading", { level: 1 }) ?? false}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              title="Overskrift 1"
            >
              H1
            </ToolBtn>
            <ToolBtn
              active={editor?.isActive("heading", { level: 2 }) ?? false}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              title="Overskrift 2"
            >
              H2
            </ToolBtn>
            <div className="w-px h-4 bg-border mx-1" />
            <ToolBtn
              active={editor?.isActive("bulletList") ?? false}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              title="Punktliste"
            >
              • —
            </ToolBtn>
            <ToolBtn
              active={editor?.isActive("orderedList") ?? false}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              title="Nummereret liste"
            >
              1.
            </ToolBtn>
            <div className="w-px h-4 bg-border mx-1" />
            <ToolBtn
              active={editor?.isActive("blockquote") ?? false}
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              title="Citat"
            >
              "
            </ToolBtn>
          </div>

          {/* Tiptap editor */}
          <div className="flex-1 overflow-y-auto">
            <EditorContent editor={editor} />
          </div>

          {/* PDF-sektion */}
          {pdfs.length > 0 && (
            <div className="border-t border-border px-7 py-3 shrink-0 space-y-2">
              {pdfs.map((pdf) => (
                <div key={pdf} className="flex items-center gap-2">
                  <button
                    onClick={() => setOpenPdf(openPdf === pdf ? null : pdf)}
                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <span>📄</span>
                    <span className="truncate max-w-[200px]">{pdf}</span>
                    <span className="text-muted-foreground">{openPdf === pdf ? "▲ Luk" : "▼ Vis"}</span>
                  </button>
                  <button
                    onClick={() => deletePdf(pdf)}
                    className="text-xs text-muted-foreground/50 hover:text-destructive transition-colors ml-auto"
                  >
                    Fjern
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* PDF-viewer */}
          {openPdf && (
            <div className="border-t border-border shrink-0" style={{ height: 420 }}>
              <iframe
                src={`/api/notes/pdf?noteId=${activeId}&filename=${encodeURIComponent(openPdf)}`}
                className="w-full h-full"
                title={openPdf}
              />
            </div>
          )}

          {/* Tags + PDF-upload */}
          <div className="px-7 py-3.5 border-t border-border shrink-0 flex items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-destructive leading-none">×</button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Tilføj tag, tryk Enter…"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                className="text-xs text-muted-foreground focus:outline-none bg-transparent placeholder:text-muted-foreground/40 min-w-[130px]"
              />
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                onChange={uploadPdf}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="cursor-pointer text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <span>📎</span> Vedhæft PDF
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ToolBtn({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  title?: string;
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`px-2.5 py-1 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
