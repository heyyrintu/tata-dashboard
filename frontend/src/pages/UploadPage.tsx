import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { uploadWorkbook, type UploadResult } from '../services/nplApi';
import { useNplData } from '../context/NplDataContext';
import { Card, useSurface, fmtInt } from '../components/npl/ui';
import {
  IconUpload,
  IconFileSpreadsheet,
  IconCircleCheck,
  IconAlertTriangle,
  IconLoader2,
  IconX,
} from '@tabler/icons-react';

const FLAG_LABELS: Record<string, string> = {
  pack_size_mismatch: 'Litres disagree with the pack size in the material name',
  expected_before_lr: 'Expected delivery date before the LR date',
  dispatch_year_corrected: 'Dispatch date year corrected',
  delivered_before_dispatch: 'Delivered before dispatch',
  missing_litres: 'Buckets with no litres',
  vendor_alias_applied: 'Vendor name merged into its canonical spelling',
  missing_lr_date: 'No LR date',
};

export default function UploadPage() {
  const s = useSurface();
  const navigate = useNavigate();
  const { refresh } = useNplData();

  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
  });

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    setProgress(0);
    setError(null);
    try {
      const r = await uploadWorkbook(file, setProgress);
      setResult(r);
      if (r.success) refresh();
      else setError(r.error ?? r.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`min-h-screen ${s.page}`}>
      <div className="mx-auto max-w-4xl px-6 py-8">
        <header className="mb-6">
          <h1 className={`text-xl font-semibold ${s.heading}`}>Import MIS Master Sheet</h1>
          <p className={`mt-0.5 text-sm ${s.muted}`}>
            Upload the NPL DEF workbook. Every branch tab is parsed, Sonipat&apos;s split tabs are merged, and the
            import <span className="font-medium">replaces</span> all existing shipment data.
          </p>
        </header>

        <Card className="mb-5">
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
              isDragActive
                ? 'border-brand-600 bg-brand-600/5'
                : s.light
                  ? 'border-gray-300 hover:border-brand-500'
                  : 'border-white/15 hover:border-brand-600/60'
            }`}
          >
            <input {...getInputProps()} />
            <IconUpload className={`mx-auto h-9 w-9 ${s.muted}`} />
            <p className={`mt-3 text-sm font-medium ${s.heading}`}>
              {isDragActive ? 'Drop the workbook here' : 'Drag a workbook here, or click to browse'}
            </p>
            <p className={`mt-1 text-xs ${s.muted}`}>.xlsx or .xls · up to 10 MB</p>
          </div>

          {file && (
            <div className={`mt-4 flex items-center gap-3 rounded-xl border px-4 py-3 ${s.divider}`}>
              <IconFileSpreadsheet className="h-5 w-5 shrink-0 text-brand-600" />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${s.heading}`}>{file.name}</p>
                <p className={`text-xs ${s.muted}`}>{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              {!busy && (
                <button
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                    setError(null);
                  }}
                  className={`rounded-lg p-1.5 ${s.muted} hover:text-red-500`}
                  title="Remove"
                >
                  <IconX className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {busy && (
            <div className="mt-4">
              <div className={`h-2 overflow-hidden rounded-full ${s.light ? 'bg-gray-200' : 'bg-white/10'}`}>
                <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className={`mt-2 flex items-center gap-2 text-xs ${s.muted}`}>
                <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                {progress < 100 ? `Uploading… ${progress}%` : 'Parsing and importing…'}
              </p>
            </div>
          )}

          <button
            onClick={submit}
            disabled={!file || busy}
            className="mt-4 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Importing…' : 'Import workbook'}
          </button>
        </Card>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4">
            <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-500">Import failed</p>
              <p className={`mt-0.5 text-xs ${s.muted}`}>{error}</p>
            </div>
          </div>
        )}

        {result?.success && (
          <>
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
              <IconCircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{result.message}</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  View dashboard
                </button>
              </div>
            </div>

            {result.sheets && result.sheets.length > 0 && (
              <Card title="Sheets parsed" className="mb-5" bodyClassName="px-0 py-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${s.headRow} text-left`}>
                      <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide">Sheet</th>
                      <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide">Branch</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide">Imported</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide">Skipped</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.sheets.map((sh) => (
                      <tr key={sh.name} className={`border-t ${s.divider}`}>
                        <td className={`px-4 py-2 ${s.heading}`}>{sh.name}</td>
                        <td className={`px-4 py-2 ${s.subtle}`}>{sh.branch}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{fmtInt(sh.rows)}</td>
                        <td className={`px-4 py-2 text-right tabular-nums ${sh.skipped > 0 ? 'text-amber-500' : s.muted}`}>
                          {fmtInt(sh.skipped)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className={`px-4 py-3 text-xs ${s.muted}`}>
                  Skipped rows are blank or partial entries with no date, origin, volume or party.
                </p>
              </Card>
            )}

            {result.flagCounts && Object.keys(result.flagCounts).length > 0 && (
              <Card title="Data issues detected" subtitle="Rows imported, but worth fixing at source" className="mb-5">
                <ul className="flex flex-col gap-2">
                  {Object.entries(result.flagCounts).map(([flag, count]) => (
                    <li key={flag} className="flex items-center justify-between gap-4 text-sm">
                      <span className={s.subtle}>{FLAG_LABELS[flag] ?? flag}</span>
                      <span className="font-semibold tabular-nums text-amber-500">{fmtInt(count)}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/data-quality')}
                  className="mt-4 text-xs font-medium text-brand-600 hover:underline"
                >
                  See the full data-quality breakdown →
                </button>
              </Card>
            )}

            {result.warnings && result.warnings.length > 0 && (
              <Card title="Parser warnings">
                <ul className={`flex list-disc flex-col gap-1 pl-5 text-xs ${s.muted}`}>
                  {result.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
