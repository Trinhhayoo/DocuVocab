"use client";

type InteractiveDocReaderProps = {
  htmlContent: string;
  onSelectText: (text: string) => void;
};

export function InteractiveDocReader({
  htmlContent,
  onSelectText,
}: InteractiveDocReaderProps) {
  function handleMouseUp() {
  const selectedText = window.getSelection()?.toString().trim();

  if (!selectedText) return;

  const cleanText = selectedText
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?()[\]{}"'“”‘’]/g, "")
    .trim();

  if (!cleanText) return;

  if (cleanText.length > 80) return;

  onSelectText(cleanText);
}

  return (
    <div
      className="doc-reader-content"
      onMouseUp={handleMouseUp}
      dangerouslySetInnerHTML={{
        __html: htmlContent,
      }}
    />
  );
}