import { useEffect, useRef } from "react";
import { useStudio } from "../store";

// Die contenteditable-Editoren sind bewusst unkontrolliert: React setzt
// innerHTML nur, wenn der Store-Inhalt vom DOM abweicht und der Editor nicht
// fokussiert ist (sonst springt der Cursor beim Tippen).
export function TextEditorGroup() {
  const slide = useStudio((s) => s.slides[s.current]);
  const setSlideText = useStudio((s) => s.setSlideText);
  const hRef = useRef<HTMLDivElement>(null);
  const sRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = hRef.current!;
    const su = sRef.current!;
    if (document.activeElement !== h && h.innerHTML !== slide.headlineHTML)
      h.innerHTML = slide.headlineHTML;
    if (document.activeElement !== su && su.innerHTML !== slide.subHTML)
      su.innerHTML = slide.subHTML;
  }, [slide]);

  const sync = () => setSlideText(hRef.current!.innerHTML, sRef.current!.innerHTML);

  const exec = (cmd: string, value?: string) => {
    try {
      document.execCommand("styleWithCSS", false, "false");
    } catch {
      /* ältere Browser */
    }
    document.execCommand(cmd, false, value);
    sync();
  };

  // Der native Farbdialog zieht den Fokus aus dem Editor, dabei geht die
  // Selektion verloren — deshalb wird sie bei mousedown gesichert und vor
  // dem Anwenden der Farbe wiederhergestellt.
  const savedRange = useRef<Range | null>(null);
  const saveSelection = () => {
    const sel = window.getSelection();
    savedRange.current = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
  };
  const applyColor = (value: string) => {
    const range = savedRange.current;
    if (!range) return;
    // execCommand wirkt nur, wenn der Editing-Host fokussiert ist — der
    // Farbdialog hat den Fokus aber auf das <input type="color"> gezogen.
    const host = [hRef.current, sRef.current].find(
      (el) => el && el.contains(range.commonAncestorContainer),
    );
    if (!host) return;
    host.focus();
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
    exec("foreColor", value);
    // Chrome feuert während des Pickens laufend Change-Events; die Selektion
    // nach der DOM-Mutation neu sichern, sonst arbeitet der nächste Aufruf
    // auf einer ungültigen Range.
    saveSelection();
  };

  return (
    <div className="group">
      <label className="title">Slide text</label>
      <div className="toolbar">
        {(
          [
            ["b", "bold", "Bold", "B"],
            ["i", "italic", "Italic", "I"],
            ["u", "underline", "Underline", "U"],
          ] as const
        ).map(([cls, cmd, title, label]) => (
          <button
            key={cmd}
            className={cls}
            title={title}
            onMouseDown={(e) => {
              e.preventDefault();
              exec(cmd);
            }}
          >
            {label}
          </button>
        ))}
        <input
          type="color"
          className="textcolor"
          title="Color for selected text"
          defaultValue="#e05555"
          onMouseDown={saveSelection}
          onChange={(e) => applyColor(e.target.value)}
        />
      </div>
      <div
        ref={hRef}
        className="editor headline"
        contentEditable
        data-ph="Headline…"
        onInput={sync}
      />
      <div
        ref={sRef}
        className="editor sub"
        contentEditable
        data-ph="Subline (optional)…"
        onInput={sync}
      />
      <div className="hint">
        Select individual words and use B / I / U or the color picker to format just those parts.
      </div>
    </div>
  );
}
