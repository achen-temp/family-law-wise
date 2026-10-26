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
    setPreview({ file, url: preview!.url, error: "This file could not be previewed. It may be damaged or unsupported by your browser. Try again or choose another copy." });
    onPreviewError?.(true);
  }

  return (
    <section className="min-w-0 space-y-3 rounded-lg border border-line p-4">
      <p className="text-sm font-medium">Local file preview</p>
      <p className="text-xs text-muted">Demo: this file is available in the current application session only. Refreshing resets submitted files.</p>
      {preview.error ? (
        <div role="alert" className="space-y-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
          <p>{preview.error}</p>
          <button type="button" className="btn btn-secondary" onClick={() => setAttempt((value) => value + 1)}>Try preview again</button>
        </div>
      ) : isPdf ? (
        <object data={preview.url} type="application/pdf" onError={failPreview} aria-label={`Preview of ${file.name}`} className="h-[420px] w-full rounded-lg border border-line sm:h-[560px]">
          <p className="p-4 text-sm text-muted">Your browser cannot display this PDF here. Open it using the link below.</p>
        </object>
      ) : (
        // Browser object URLs are not served by the Next.js image optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview.url} onError={failPreview} alt={`Preview of ${file.name}`} className="max-h-[560px] w-full rounded-lg border border-line object-contain" />
      )}
      <a href={preview.url} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-medium text-brand underline underline-offset-4">Open local file in a new tab</a>
      {isPdf && !preview.error ? <p className="text-xs text-muted">If the PDF is blank or reports an error, open it using the link above or choose another copy. Browser PDF readers may not report loading errors here.</p> : null}
      {onChooseAnother ? <button type="button" onClick={onChooseAnother} className="block text-sm font-medium text-brand underline underline-offset-4">Choose another file</button> : null}
    </section>
  );
}
