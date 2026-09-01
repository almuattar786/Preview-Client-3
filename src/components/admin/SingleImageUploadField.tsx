import React, { useState, useRef } from 'react';
import { UploadCloud, Link as LinkIcon, Image as ImageIcon, Trash2, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';

interface SingleImageUploadFieldProps {
  label: string;
  sublabel?: string;
  value: string;
  onChange: (url: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
  defaultPlaceholder?: string;
  disabled?: boolean;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB strictly enforced
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'];

export const SingleImageUploadField: React.FC<SingleImageUploadFieldProps> = ({
  label,
  sublabel,
  value,
  onChange,
  onShowToast = () => {},
  defaultPlaceholder = 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1200',
  disabled = false
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!file) {
      return { valid: false, error: 'No file selected.' };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: 'Image size must be 5 MB or less.'
      };
    }

    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    const isMimeValid = ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase());
    const isExtValid = ALLOWED_EXTENSIONS.includes(fileExt);

    if (!isMimeValid && !isExtValid) {
      return {
        valid: false,
        error: 'Please select a valid JPG, PNG, or WEBP image.'
      };
    }

    return { valid: true };
  };

  const uploadFile = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      onShowToast(validation.error || 'Invalid file.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Unable to upload image. Please try again.');
      }

      onChange(data.url);
      onShowToast('Image uploaded successfully!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Upload failed.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  return (
    <div className="bg-stone-50 dark:bg-[#0e0e0e] border border-stone-200 dark:border-[#c5a059]/20 rounded-xl p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-[#c5a059]/15 pb-2.5">
        <div>
          <label className="font-semibold text-xs text-stone-800 dark:text-[#f5f5f1] uppercase tracking-wider block">
            {label}
          </label>
          {sublabel && (
            <span className="text-[10px] text-stone-500 dark:text-zinc-400 block font-light">
              {sublabel}
            </span>
          )}
        </div>

        {/* Upload Mode Selector Toggle */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#1a1a1a] p-1 rounded-lg border border-stone-200 dark:border-[#c5a059]/20 text-[11px]">
          <button
            type="button"
            onClick={() => setActiveMode('upload')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 font-medium ${
              activeMode === 'upload'
                ? 'bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-semibold shadow-xs'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <UploadCloud className="w-3 h-3" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('url')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 font-medium ${
              activeMode === 'url'
                ? 'bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-semibold shadow-xs'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>Image URL</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Preview Thumbnail */}
        <div className="sm:col-span-4 relative group rounded-xl overflow-hidden bg-stone-900 border border-stone-300 dark:border-[#c5a059]/30 aspect-[4/5] sm:aspect-[3/4] flex items-center justify-center">
          <img
            src={value || defaultPlaceholder}
            alt={label}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = defaultPlaceholder;
            }}
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2 text-white">
              <Loader2 className="w-6 h-6 animate-spin text-[#c5a059]" />
              <span className="text-[10px] font-mono">Uploading...</span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] px-2 py-1 rounded font-mono truncate text-center">
            {value ? 'Active Image' : 'Default Placeholder'}
          </div>
        </div>

        {/* Input & Upload Controls */}
        <div className="sm:col-span-8 space-y-3">
          {activeMode === 'upload' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => {
                if (!disabled && !isUploading && fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                isDragOver
                  ? 'border-[#9a7229] dark:border-[#c5a059] bg-[#9a7229]/10'
                  : 'border-stone-300 dark:border-[#c5a059]/30 hover:border-[#9a7229] dark:hover:border-[#c5a059] bg-white dark:bg-[#141414]'
              } ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={disabled || isUploading}
              />
              <div className="w-10 h-10 rounded-full bg-[#9a7229]/10 dark:bg-[#c5a059]/10 text-[#9a7229] dark:text-[#c5a059] flex items-center justify-center">
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <UploadCloud className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-stone-900 dark:text-[#f5f5f1]">
                  Click to select from device or drag image here
                </p>
                <p className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono">
                  Supported: JPG, PNG, WEBP • Max: 5 MB
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider block">
                Direct Image URL
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                disabled={disabled || isUploading}
                className="w-full bg-white dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 rounded-xl p-3 text-stone-900 dark:text-[#f5f5f1] font-mono text-xs focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            {value && value !== defaultPlaceholder && (
              <button
                type="button"
                onClick={() => onChange(defaultPlaceholder)}
                disabled={disabled || isUploading}
                className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 transition-colors inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset to Default</span>
              </button>
            )}
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>5 MB limit enforced</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
