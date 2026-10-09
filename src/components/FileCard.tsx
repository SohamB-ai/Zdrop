"use client";

import { FileText, FileImage, File, X } from "lucide-react";
import { FileMetadata } from "@/lib/types";
import { formatBytes, getFileCategory } from "@/lib/utils";

interface FileCardProps {
  file: FileMetadata;
  onRemove: (fileId: string) => void;
  disabled?: boolean;
}

export function FileCard({ file, onRemove, disabled = false }: FileCardProps) {
  const category = getFileCategory(file.type);

  const renderIcon = () => {
    switch (category) {
      case "pdf":
        return <FileText className="w-4 h-4 text-rose-500 dark:text-rose-400" />;
      case "docx":
        return <FileText className="w-4 h-4 text-blue-600 dark:text-cyan-400" />;
      case "image":
        return <FileImage className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <File className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161B26] hover:border-blue-400 dark:hover:border-cyan-500/30 transition-all shadow-2xs">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-[#0F131D] border border-slate-200 dark:border-white/5 shrink-0">
          {renderIcon()}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs font-sans">
            {file.name}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>{formatBytes(file.size)}</span>
            {file.pageCount && (
              <>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <span className="text-blue-600 dark:text-cyan-400 font-semibold">{file.pageCount} pages</span>
              </>
            )}
          </div>
        </div>
      </div>

      {!disabled && (
        <button
          type="button"
          onClick={() => onRemove(file.fileId)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition active:scale-[0.95] cursor-pointer shrink-0 ml-2"
          aria-label={`Remove ${file.name}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
