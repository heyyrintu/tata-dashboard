import { useState, useRef } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { uploadExcel, getAnalytics } from '../services/api';
import { LoadingSpinner } from './LoadingSpinner';

interface FileUploadProps {
  onClose: () => void;
}

export default function FileUpload({ onClose }: FileUploadProps) {
  const { setUploadedFileName, setMetrics, setIsLoading, setError, setDateRange } = useDashboard();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Accept all file types - no restrictions
      setFile(selectedFile);
      setUploadStatus(null);
    }
  };

  const handleProcess = async () => {
    if (!file) {
      setUploadStatus({ type: 'error', message: 'Please select a file first' });
      return;
    }

    setUploading(true);
    setIsLoading(true);
    setUploadStatus(null);

    try {
      const response = await uploadExcel(file);
      
      setUploadStatus({
        type: 'success',
        message: response.message,
      });
      
      setUploadedFileName(response.fileName);
      
      // Fetch analytics after successful upload
      const analytics = await getAnalytics();
      setMetrics({
        totalIndents: analytics.totalIndents,
        totalIndentsUnique: analytics.totalIndentsUnique,
      });

      // Reset date range to last 30 days
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 30);
      setDateRange(from, to);

      setTimeout(() => {
        onClose();
        setFile(null);
        setUploadStatus(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to process file',
      });
      setError(error instanceof Error ? error.message : 'Process failed');
    } finally {
      setUploading(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-slate-700">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Upload File</h2>

          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-500 file:text-white hover:file:bg-primary-600"
            />
            {file && (
              <p className="mt-2 text-sm text-slate-300">{file.name}</p>
            )}
          </div>

          {uploadStatus && (
            <div
              className={`mb-4 p-3 rounded-lg ${
                uploadStatus.type === 'success'
                  ? 'bg-green-900/30 text-green-300 border border-green-700'
                  : 'bg-red-900/30 text-red-300 border border-red-700'
              }`}
            >
              {uploadStatus.message}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-all duration-300"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleProcess}
              disabled={!file || uploading}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              {uploading && <LoadingSpinner size="sm" />}
              <span>{uploading ? 'Processing...' : '🚀 Process'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

