import { useRef, useState } from "react";
import { motion } from "motion/react";
import { IconUpload } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";
import { useDashboard } from '../context/DashboardContext';
import { uploadExcel, getAnalytics } from '../services/api';
import { HoverBorderGradient } from './HoverBorderGradient';

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface FileUploadNewProps {
  onClose: () => void;
}

export const FileUploadNew = ({ onClose }: FileUploadNewProps) => {
  const { setUploadedFileName, setMetrics, setIsLoading, setError, setDateRange } = useDashboard();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (newFiles: File[]) => {
    setFiles(newFiles);
    setUploadStatus(null);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (error) => {
      console.log(error);
      setUploadStatus({ type: 'error', message: 'Invalid file type. Only Excel files (.xlsx, .xls) are allowed.' });
    },
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    }
  });

  const handleProcess = async () => {
    if (files.length === 0) {
      setUploadStatus({ type: 'error', message: 'Please select a file first' });
      return;
    }

    setUploading(true);
    setIsLoading(true);
    setUploadStatus(null);

    try {
      const response = await uploadExcel(files[0]);
      
      setUploadStatus({
        type: 'success',
        message: response.message,
      });
      
      setUploadedFileName(response.fileName);
      
      // Fetch analytics after successful upload
      const analytics = await getAnalytics();
      setMetrics({
        totalTrips: analytics.totalTrips,
        totalIndents: analytics.totalIndents,
      });

      // Reset date range to last 30 days
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 30);
      setDateRange(from, to);

      setTimeout(() => {
        onClose();
        setFiles([]);
        setUploadStatus(null);
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
    <div className="w-full">
      <div className="glass-card rounded-2xl shadow-2xl max-w-3xl w-full mx-auto border border-blue-900/50 relative">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Upload Excel File</h2>
          </div>

          <div className="w-full" {...getRootProps()}>
            <motion.div
              onClick={handleClick}
              whileHover="animate"
              className="p-10 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden border-2 border-dashed border-slate-600 hover:border-purple-500 transition-all duration-300"
            >
              <input
                ref={fileInputRef}
                id="file-upload-handle"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const selectedFiles = Array.from(e.target.files || []);
                  if (selectedFiles.length > 0) {
                    handleFileChange(selectedFiles);
                  }
                }}
                className="hidden"
              />
              <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-20">
                <GridPattern />
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="relative z-20 font-sans font-bold text-slate-300 text-base">
                  Upload file
                </p>
                <p className="relative z-20 font-sans font-normal text-slate-400 text-base mt-2">
                  Drag or drop your files here or click to upload
                </p>
                <div className="relative w-full mt-10 max-w-xl mx-auto">
                  {files.length > 0 &&
                    files.map((file, idx) => (
                      <motion.div
                        key={"file" + idx}
                        layoutId={idx === 0 ? "file-upload" : "file-upload-" + idx}
                        className={cn(
                          "relative overflow-hidden z-40 glass-card flex flex-col items-start justify-start md:h-24 p-4 mt-4 w-full mx-auto rounded-md",
                          "shadow-lg"
                        )}
                      >
                        <div className="flex justify-between w-full items-center gap-4">
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            layout
                            className="text-base text-slate-300 truncate max-w-xs"
                          >
                            {file.name}
                          </motion.p>
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            layout
                            className="rounded-lg px-2 py-1 w-fit shrink-0 text-sm bg-slate-700 text-white shadow-input"
                          >
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </motion.p>
                        </div>

                        <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-slate-400">
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            layout
                            className="px-1 py-0.5 rounded-md bg-slate-800"
                          >
                            {file.type || 'application/vnd.ms-excel'}
                          </motion.p>

                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            layout
                          >
                            modified{" "}
                            {new Date(file.lastModified).toLocaleDateString()}
                          </motion.p>
                        </div>
                      </motion.div>
                    ))}
                  {!files.length && (
                    <motion.div
                      layoutId="file-upload"
                      variants={mainVariant}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className={cn(
                        "relative group-hover/file:shadow-2xl z-40 glass-card flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md",
                        "shadow-xl"
                      )}
                    >
                      {isDragActive ? (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-slate-400 flex flex-col items-center"
                        >
                          Drop it
                          <IconUpload className="h-4 w-4 text-slate-400" />
                        </motion.p>
                      ) : (
                        <IconUpload className="h-8 w-8 text-purple-500" />
                      )}
                    </motion.div>
                  )}

                  {!files.length && (
                    <motion.div
                      variants={secondaryVariant}
                      className="absolute opacity-0 border border-dashed border-purple-400 inset-0 z-30 bg-transparent flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md"
                    ></motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {uploadStatus && (
            <div
              className={`mt-4 p-3 rounded-lg ${
                uploadStatus.type === 'success'
                  ? 'bg-green-900/30 text-green-300 border border-green-700'
                  : 'bg-red-900/30 text-red-300 border border-red-700'
              }`}
            >
              {uploadStatus.message}
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-8">
            <HoverBorderGradient
              onClick={handleProcess}
              disabled={!files.length || uploading}
              containerClassName="rounded-full"
              className={`px-6 py-3 text-white bg-black/40 font-semibold ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              duration={1}
            >
              {uploading ? 'Processing...' : '🚀 Process File'}
            </HoverBorderGradient>
          </div>
        </div>
      </div>
    </div>
  );
};

function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-slate-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-slate-950"
                  : "bg-slate-900 shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
              }`}
            />
          );
        })
      )}
    </div>
  );
}

