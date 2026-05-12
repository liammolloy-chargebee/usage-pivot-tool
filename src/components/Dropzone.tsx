import { useCallback, useRef, type ChangeEvent, type DragEvent } from "react";

type Props = {
  onCsvText: (text: string, fileName: string) => void;
  disabled?: boolean;
};

export function Dropzone({ onCsvText, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file || disabled) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : "";
        onCsvText(text, file.name);
      };
      reader.readAsText(file, "UTF-8");
    },
    [disabled, onCsvText],
  );

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    handleFile(f);
    e.target.value = "";
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    handleFile(f);
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="w-full max-w-2xl">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv,text/plain"
        className="hidden"
        onChange={onInputChange}
        disabled={disabled}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-6 py-14 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="text-lg font-medium text-slate-800">
          Drop your billing CSV here
        </span>
        <span className="mt-2 text-sm text-slate-500">
          or click to choose a file — parsing happens in your browser only
        </span>
      </button>
    </div>
  );
}
