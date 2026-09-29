import React, { useState, useRef } from 'react';
import { ExcelForecastRow } from '../../types';
import { Modal } from '../common/Modal';
import {
  parseExcelForecastFile,
  commitExcelForecasts,
  downloadForecastTemplate,
} from '../../services/forecastService';
import { useAuth } from '../../hooks/useAuth';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  FileText,
} from 'lucide-react';

interface ForecastImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (importedCount: number) => void;
}

export const ForecastImportModal: React.FC<ForecastImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [rows, setRows] = useState<ExcelForecastRow[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'invalid'>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await processFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      await processFile(droppedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls') {
      setErrorMsg('Format file harus berupa Excel (.xlsx atau .xls).');
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);
    setErrorMsg(null);

    try {
      const parsed = await parseExcelForecastFile(selectedFile);
      setRows(parsed);
      if (parsed.length === 0) {
        setErrorMsg('File Excel tidak memiliki baris data yang terbaca.');
      }
    } catch (err: any) {
      console.error('Error parsing excel:', err);
      setErrorMsg(err?.message || 'Gagal memproses file Excel. Pastikan format tabel sesuai template.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setRows([]);
    setErrorMsg(null);
    setFilterMode('all');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validRows = rows.filter((r) => r.isValid);
  const invalidRows = rows.filter((r) => !r.isValid);

  const displayedRows =
    filterMode === 'valid'
      ? validRows
      : filterMode === 'invalid'
      ? invalidRows
      : rows;

  const handleCommit = async () => {
    if (validRows.length === 0) {
      setErrorMsg('Tidak ada baris valid yang dapat diimpor.');
      return;
    }

    try {
      setIsCommitting(true);
      setErrorMsg(null);
      const created = await commitExcelForecasts(validRows, {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
      });

      onSuccess(created.length);
      handleReset();
      onClose();
    } catch (err: any) {
      console.error('Error committing forecast import:', err);
      setErrorMsg(err?.message || 'Gagal menyimpan forecast ke sistem.');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="Import Forecast dari File Excel"
      size="xl"
    >
      <div className="space-y-5">
        {/* Top Template Helper Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-sky-800 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-sky-950">
                Gunakan Template Resmi Forecast Akram
              </p>
              <p className="text-[11px] text-sky-700">
                Kolom standar: Customer Code, DC Code, Periode, Tanggal Forecast, SKU, Qty, Target Delivery
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={downloadForecastTemplate}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-900 bg-white border border-sky-300 rounded-lg hover:bg-sky-50 shadow-xs shrink-0 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-700" />
            <span>Unduh Template .XLSX</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1: File Dropzone (if no rows parsed) */}
        {rows.length === 0 ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-8 text-center transition-colors bg-slate-50/50 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              Pilih atau Tarik File Excel ke Sini
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Mendukung file spreadsheet Microsoft Excel (.xlsx dan .xls) hingga ukuran 10MB
            </p>
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-800 hover:bg-sky-900 rounded-lg transition-colors shadow-xs"
            >
              {isParsing ? 'Membaca File...' : 'Pilih File Excel'}
            </button>
          </div>
        ) : (
          /* Step 2: Validation Preview Table */
          <div className="space-y-4">
            {/* File Info & Summary Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <span className="font-semibold text-slate-800">{file?.name}</span>
                <span className="text-slate-500">
                  ({Math.round((file?.size || 0) / 1024)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ganti File Lain</span>
              </button>
            </div>

            {/* Validation Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  filterMode === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="text-[11px] block uppercase font-medium opacity-80">
                  Total Baris Data
                </span>
                <span className="text-lg font-bold tabular-nums">{rows.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('valid')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  filterMode === 'valid'
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-emerald-50/60 text-emerald-800 border-emerald-200 hover:bg-emerald-100/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] block uppercase font-medium opacity-80">
                    Baris Valid
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-lg font-bold tabular-nums">{validRows.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('invalid')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  filterMode === 'invalid'
                    ? 'bg-rose-700 text-white border-rose-700'
                    : 'bg-rose-50/60 text-rose-800 border-rose-200 hover:bg-rose-100/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] block uppercase font-medium opacity-80">
                    Baris Error / Invalid
                  </span>
                  <XCircle className="w-4 h-4 text-rose-600" />
                </div>
                <span className="text-lg font-bold tabular-nums">{invalidRows.length}</span>
              </button>
            </div>

            {/* Notice if any row has errors */}
            {invalidRows.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">
                    Terdapat {invalidRows.length} baris yang tidak memenuhi validasi.
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Hanya baris dengan status valid ({validRows.length} baris) yang akan diimpor ke sistem. Baris error akan diabaikan.
                  </p>
                </div>
              </div>
            )}

            {/* Preview Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">Row</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">DC Code</th>
                      <th className="py-2.5 px-3">Periode</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3">Target Delivery</th>
                      <th className="py-2.5 px-3">Catatan / Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {displayedRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40 hover:bg-rose-50/60'}
                      >
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {row.rowNumber}
                        </td>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              Error
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{row.customerCode}</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{row.dcCode}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{row.period}</td>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-900">{row.sku}</td>
                        <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-900">
                          {row.qty.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                          {row.targetDelivery}
                        </td>
                        <td className="py-2 px-3 max-w-xs truncate">
                          {row.isValid ? (
                            <span className="text-slate-400 text-[11px]">{row.notes || '-'}</span>
                          ) : (
                            <span className="text-rose-700 font-medium text-[11px]">
                              {row.errors.join('; ')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            disabled={isCommitting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>

          {rows.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Siap memproses <strong className="text-slate-900">{validRows.length}</strong> baris valid
              </span>
              <button
                type="button"
                onClick={handleCommit}
                disabled={isCommitting || validRows.length === 0}
                className="px-5 py-2 text-xs font-semibold text-white bg-sky-800 hover:bg-sky-900 rounded-lg disabled:opacity-50 transition-colors shadow-xs"
              >
                {isCommitting ? 'Menyimpan ke Sistem...' : `Import ${validRows.length} Baris Valid`}
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
