"use client";

import { useEffect, useState } from "react";

export function LocalFilePreview({ file, onChooseAnother, onPreviewError }: {
  file: File;
  onChooseAnother?: () => void;
  onPreviewError?: (failed: boolean) => void;
}) {
  const [preview, setPreview] = useState<{ file: File; url: string; error?: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const isPdf = file.type === "application/pdf" || (!file.type && /\.pdf$/i.test(file.name));

  useEffect(() => {
    const url = URL.createObjectURL(file);
    let active = true;
    // Synchronize the browser-managed URL with this file and release it on cleanup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview({ file, url });
    onPreviewError?.(false);
    if (isPdf) {
      void file.slice(0, 1024).text().then((header) => {
        if (!active || header.includes("%PDF-")) return;
        setPreview({ file, url, error: "This file does not contain a readable PDF header. Choose another PDF copy." });
        onPreviewError?.(true);
      }).catch(() => {
        if (!active) return;
        setPreview({ file, url, error: "The local file could not be read. Try the preview again or choose another file." });
        onPreviewError?.(true);
      });
    }
    return () => { active = false; URL.revokeObjectURL(url); };
  }, [file, isPdf, attempt, onPreviewError]);

  if (!preview || preview.file !== file) return <p className="text-sm text-muted">Loading local preview…</p>;

  function failPreview() {
    setPreview({ file, url: preview!.url, error: "This file could not be previewed. It may be damaged or unsupported by your browser." });
    onPreviewError?.(true);
  }

  return (
    <section aria-label="Local file preview" className="min-w-0 space-y-3">
      <header className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-xs font-semibold uppercase text-brand">{isPdf ? "PDF" : "IMG"}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium" title={file.name}>{file.name}</p>
            <p className="text-xs text-muted">{isPdf ? "PDF document" : "Image"} · {formatFileSize(file.size)} · Available in this session only</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <a href={preview.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand underline underline-offset-4">Open in new tab</a>
          {onChooseAnother ? <button type="button" onClick={onChooseAnother} className="text-sm font-medium text-brand underline underline-offset-4">Choose another</button> : null}
        </div>
      </header>

      {preview.error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="min-w-0 flex-1">{preview.error}</p>
          <button type="button" className="shrink-0 font-medium underline underline-offset-4" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
        </div>
      ) : (
        <div className="grid min-h-[360px] min-w-0 place-items-center overflow-hidden rounded-lg border border-line bg-[#eef1f5] p-3 sm:min-h-[520px] sm:p-6">
          {isPdf ? (
            <object data={preview.url} type="application/pdf" onError={failPreview} aria-label={`Preview of ${file.name}`} className="h-[min(72vh,900px)] min-h-[420px] w-full rounded-md bg-white shadow-sm sm:min-h-[520px]">
              <div className="grid h-full min-h-[420px] place-items-center p-6 text-center text-sm text-muted">Your browser cannot display this PDF. Open it in a new tab or choose another file.</div>
            </object>
          ) : (
            // Browser object URLs are not served by the Next.js image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.url} onError={failPreview} alt={`Preview of ${file.name}`} className="block max-h-[min(72vh,900px)] min-h-0 max-w-full rounded-md object-contain shadow-sm" />
          )}
        </div>
      )}
      {isPdf && !preview.error ? <p className="text-xs text-muted">Browser PDF readers may not report blank or unreadable files. Use Open in new tab if the preview does not load.</p> : null}
      <p className="sr-only">Demo only. Refreshing the application resets local files.</p>
    </section>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
