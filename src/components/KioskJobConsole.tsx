"use client";

import { useState, useRef, useEffect } from "react";
import {
  Printer,
  Trash2,
  FileText,
  FileImage,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  Palette,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";
import { SessionData, FileMetadata } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

interface KioskJobConsoleProps {
  session: SessionData;
  onPrint: () => void;
  onCompleteAndPurge: () => void;
  onCancel: () => void;
  isPurging?: boolean;
}

export function KioskJobConsole({
  session,
  onPrint,
  onCompleteAndPurge,
  onCancel,
  isPurging = false,
}: KioskJobConsoleProps) {
  const [selectedFile, setSelectedFile] = useState<FileMetadata>(
    session.files[0]
  );

  const previewRef = useRef<HTMLIFrameElement>(null);
  const [confirmPurge, setConfirmPurge] = useState(false);
  const { preferences } = session;

  const handlePrintClick = () => {
    onPrint();
    if (!selectedFile?.previewUrl) return;
    if (selectedFile.type.includes('wordprocessing')) { window.open(selectedFile.previewUrl, '_blank', 'noopener,noreferrer'); return; }
    try { previewRef.current?.contentWindow?.focus(); previewRef.current?.contentWindow?.print(); }
    catch { window.open(selectedFile.previewUrl, '_blank', 'noopener,noreferrer'); }
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); handlePrintClick(); } };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, [selectedFile, onPrint]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Console Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition active:scale-[0.98] cursor-pointer"
            aria-label="Back to code entry"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                Session Code
              </span>
              <span className="text-base font-extrabold font-mono text-blue-600">
                {session.accessCode}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {session.files.length} document{session.files.length > 1 ? "s" : ""} attached ({formatBytes(session.totalSizeBytes)})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Status: Accessed
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Print Preferences Summary Cards */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 font-mono">
            Customer Print Configuration
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Copies */}
            <div className="p-3.5 rounded-lg bg-blue-50/50 border border-blue-100">
              <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                <Printer className="w-4 h-4" />
                <span className="text-xs font-medium">Copies</span>
              </div>
              <p className="text-lg font-extrabold text-slate-900 font-mono">
                {preferences.copies} {preferences.copies === 1 ? "Set" : "Sets"}
              </p>
            </div>

            {/* Color Mode */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-600 mb-1">
                <Palette className="w-4 h-4" />
                <span className="text-xs font-medium">Color Mode</span>
              </div>
              <p className="text-base font-bold text-slate-900">
                {preferences.colorMode === "BW" ? "Black and White" : "Full Color"}
              </p>
            </div>

            {/* Sides */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-600 mb-1">
                <Layers className="w-4 h-4" />
                <span className="text-xs font-medium">Print Sides</span>
              </div>
              <p className="text-base font-bold text-slate-900">
                {preferences.sides === "DOUBLE" ? "Double-Sided" : "Single-Sided"}
              </p>
            </div>

            {/* Pages */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-600 mb-1">
                <FileSpreadsheet className="w-4 h-4" />
                <span className="text-xs font-medium">Page Selection</span>
              </div>
              <p className="text-base font-bold text-slate-900 truncate">
                {preferences.pageRange === "ALL" ? "All Pages" : `Pages: ${preferences.pageRange}`}
              </p>
            </div>
          </div>

          {preferences.customerNotes && (
            <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Special Customer Request: </span>
                <span>{preferences.customerNotes}</span>
              </div>
            </div>
          )}
        </div>

        {/* Document Selection Tabs & Preview */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
            Documents ({session.files.length})
          </h4>

          {/* File selector pills */}
          <div className="flex flex-wrap gap-2">
            {session.files.map((file) => {
              const isSelected = selectedFile?.fileId === file.fileId;
              return (
                <button
                  key={file.fileId}
                  type="button"
                  onClick={() => setSelectedFile(file)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-900 shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span className="truncate max-w-[180px]">{file.name}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({file.pageCount ? `${file.pageCount} ${file.pageCount === 1 ? "page" : "pages"} · ` : ""}{formatBytes(file.size)})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Preview Canvas Box */}
          {selectedFile && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center min-h-[220px]">
              {selectedFile.previewUrl && selectedFile.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedFile.previewUrl}
                  alt={selectedFile.name}
                  className="max-h-72 rounded-lg shadow-xs object-contain"
                />
              ) : selectedFile.previewUrl && selectedFile.type.includes("pdf") ? (
                <div className="w-full text-center space-y-2">
                  <iframe
                    ref={previewRef}
                    src={selectedFile.previewUrl}
                    title="PDF Preview"
                    className="w-full h-64 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Download DOCX to print with Word or LibreOffice.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedFile?.previewUrl && <a className="text-sm text-blue-700 underline" href={selectedFile.previewUrl} target="_blank" rel="noopener noreferrer">Open or download selected document</a>}
        <p className="text-xs text-slate-500">Apply the customer’s copies, color, sides, and page range in the printer dialog. Print every attached document before completing the job.</p>
        {selectedFile?.type.startsWith('image/') && <iframe ref={previewRef} title="Image print frame" src={selectedFile.previewUrl} className="sr-only" />}
        <ConfirmDialog isOpen={confirmPurge} title="Finished printing all documents?" message="Wait until every document has printed successfully. Deleting the files cannot be undone." confirmLabel="Yes, delete files" onConfirm={() => { setConfirmPurge(false); onCompleteAndPurge(); }} onCancel={() => setConfirmPurge(false)} isConfirming={isPurging} />
        {/* Action Hub */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPurging}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition active:scale-[0.98] cursor-pointer"
          >
            Clear / Close
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrintClick}
              disabled={isPurging}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document (Ctrl+P)</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmPurge(true)}
              disabled={isPurging}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isPurging ? "Purging Files..." : "Mark Printed and Purge"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
