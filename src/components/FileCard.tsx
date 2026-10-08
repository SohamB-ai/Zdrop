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
        return <FileText className="w-5 h-5 text-red-500" />;
      case "docx":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "image":
        return <FileImage className="w-5 h-5 text-emerald-500" />;
      default:
        return <File className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-xs">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="p-2 rounded-md bg-slate-50 border border-slate-100 shrink-0">
          {renderIcon()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {file.name}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{formatBytes(file.size)}</span>
            {file.pageCount && (
              <>
                <span>•</span>
                <span>{file.pageCount} pages</span>
              </>
            )}
          </div>
        </div>
      </div>

      {!disabled && (
        <button
          type="button"
          onClick={() => onRemove(file.fileId)}
          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition active:scale-[0.95] cursor-pointer shrink-0 ml-2"
          aria-label={`Remove ${file.name}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
