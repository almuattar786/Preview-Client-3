import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Link as LinkIcon,
  Image as ImageIcon,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Star,
  ExternalLink,
  RefreshCw,
  Eye
} from 'lucide-react';

interface ProductImageManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
  disabled?: boolean;
}

// 5 MB strictly enforced (5 * 1024 * 1024 bytes)
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'];

export const ProductImageManager: React.FC<ProductImageManagerProps> = ({
  images,
  onChange,
  onShowToast = () => {},
  disabled = false
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [isGlobalUploading, setIsGlobalUploading] = useState<boolean>(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [globalDragOver, setGlobalDragOver] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>('');
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  // Hidden file input ref for primary upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Array of refs for replacing specific image slots
  const replaceInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  /**
   * Validate file on client side before upload
   */
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!file) {
      return { valid: false, error: 'No file selected.' };
    }

    // 1. Check size limit strictly (5 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: 'Image size must not exceed 5 MB.'
      };
    }

    // 2. Check MIME type and extension
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

  /**
   * Upload file to server endpoint
   */
  const uploadImageFile = async (file: File): Promise<string> => {
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

    return data.url;
  };

  /**
   * Handle global file upload (adds a new image to the product)
   */
  const handleGlobalFileUpload = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      onShowToast(validation.error || 'Invalid image file.', 'error');
      return;
    }

    try {
      setIsGlobalUploading(true);
      const uploadedUrl = await uploadImageFile(file);
      
      // Filter out initial placeholder if empty
      const cleanImages = images.filter((img) => img.trim() !== '');
      onChange([...cleanImages, uploadedUrl]);
      onShowToast('Image uploaded successfully.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Unable to upload image. Please try again.', 'error');
    } finally {
      setIsGlobalUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * Handle replacing an existing image slot
   */
  const handleReplaceSlot = async (slotIndex: number, file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      onShowToast(validation.error || 'Invalid image file.', 'error');
      return;
    }

    try {
      setUploadingIndex(slotIndex);
      const uploadedUrl = await uploadImageFile(file);
      
      const updated = [...images];
      updated[slotIndex] = uploadedUrl;
      onChange(updated);
      onShowToast('Image uploaded successfully.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Unable to upload image. Please try again.', 'error');
    } finally {
      setUploadingIndex(null);
      if (replaceInputRefs.current[slotIndex]) {
        replaceInputRefs.current[slotIndex]!.value = '';
      }
    }
  };

  /**
   * Handle adding URL manually
   */
  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) {
      onShowToast('Please enter a valid image URL.', 'error');
      return;
    }

    const cleanImages = images.filter((img) => img.trim() !== '');
    onChange([...cleanImages, trimmed]);
    setUrlInput('');
    onShowToast('Image URL added to product.', 'success');
  };

  /**
   * Handle updating an image slot by direct URL edit
   */
  const handleUpdateImageUrl = (index: number, newUrl: string) => {
    const updated = [...images];
    updated[index] = newUrl;
    onChange(updated);
  };

  /**
   * Remove image from list
   */
  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated.length > 0 ? updated : ['']);
    onShowToast('Image removed.', 'success');
  };

  /**
   * Set an image as primary cover image (moves it to index 0)
   */
  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const target = images[index];
    const rest = images.filter((_, i) => i !== index);
    onChange([target, ...rest]);
    onShowToast('Primary fragrance image updated.', 'success');
  };

  return (
    <div className="space-y-5">
      {/* Tab Switcher: Upload Local Image vs Image URL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-[#c5a059]/20 pb-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
          <span className="font-serif font-bold text-xs uppercase tracking-wider text-stone-900 dark:text-[#f5f5f1]">
            Product Fragrance Gallery ({images.filter((i) => i.trim() !== '').length})
          </span>
        </div>

        {/* Source Toggle Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-stone-100 dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] shadow-xs'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-[#f5f5f1]'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Local Image</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'url'
                ? 'bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] shadow-xs'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-[#f5f5f1]'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Image URL</span>
          </button>
        </div>
      </div>

      {/* OPTION 1: Upload Local Image Area */}
      {activeTab === 'upload' && (
        <div className="space-y-3">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setGlobalDragOver(true);
            }}
            onDragLeave={() => setGlobalDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setGlobalDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleGlobalFileUpload(file);
            }}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
              globalDragOver
                ? 'border-[#9a7229] dark:border-[#c5a059] bg-[#9a7229]/10 dark:bg-[#c5a059]/10'
                : 'border-stone-300 dark:border-[#c5a059]/30 bg-stone-50/50 dark:bg-[#101010] hover:border-[#9a7229] dark:hover:border-[#c5a059]'
            }`}
            onClick={() => !isGlobalUploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif"
              className="hidden"
              disabled={disabled || isGlobalUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleGlobalFileUpload(file);
              }}
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white dark:bg-[#1a1a1a] shadow-sm flex items-center justify-center border border-stone-200 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059]">
                {isGlobalUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#9a7229] dark:text-[#c5a059]" />
                ) : (
                  <UploadCloud className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
                  {isGlobalUploading ? 'Uploading...' : 'Choose Image or Drag & Drop'}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                  Select a photo directly from your Windows computer, Mac, Android, or iPhone
                </p>
              </div>

              {/* Strict 5 MB size indicator banner */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#9a7229]/10 dark:bg-[#c5a059]/15 border border-[#9a7229]/20 dark:border-[#c5a059]/30 text-[11px] font-mono text-[#9a7229] dark:text-[#c5a059]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="font-semibold">Maximum image size: 5 MB</span>
                <span className="text-stone-400 dark:text-zinc-500">|</span>
                <span>JPG, PNG, WEBP</span>
              </div>

              <button
                type="button"
                disabled={isGlobalUploading || disabled}
                className="mt-1 px-5 py-2.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] text-xs font-bold uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGlobalUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OPTION 2: Image URL Input Area */}
      {activeTab === 'url' && (
        <div className="space-y-3 bg-stone-50 dark:bg-[#101010] p-4 rounded-2xl border border-stone-200 dark:border-[#c5a059]/20">
          <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider block">
            Add Image via Web URL
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://images.unsplash.com/photo-... or /uploads/..."
              className="flex-1 bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] font-mono placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] transition-all"
            />
            <button
              type="button"
              onClick={() => handleAddUrl()}
              disabled={!urlInput.trim() || disabled}
              className="px-5 py-3 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] text-xs font-bold uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add URL</span>
            </button>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-zinc-400 font-light">
            You can paste an external HTTPS image URL or a stored path. Maximum image size recommendation: 5 MB.
          </p>
        </div>
      )}

      {/* Image Gallery Cards / List of Active Images */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-[#9a7229] dark:text-[#c5a059] font-bold">
            Fragrance Photo Slots ({images.filter((i) => i.trim() !== '').length})
          </span>
          <span className="text-[11px] text-stone-500 dark:text-zinc-400">
            First image is the primary catalog display
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {images.map((imgUrl, idx) => {
            const hasValue = Boolean(imgUrl && imgUrl.trim() !== '');
            const isUploadingThis = uploadingIndex === idx;
            const isPrimary = idx === 0;

            return (
              <div
                key={idx}
                className={`relative rounded-2xl border p-3 bg-white dark:bg-[#141414] transition-all shadow-xs space-y-2.5 ${
                  isPrimary
                    ? 'border-[#9a7229] dark:border-[#c5a059] ring-1 ring-[#9a7229]/30 dark:ring-[#c5a059]/30'
                    : 'border-stone-200 dark:border-zinc-800'
                } ${dragOverIndex === idx ? 'bg-[#9a7229]/5 dark:bg-[#c5a059]/5 border-dashed border-[#9a7229]' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverIndex(idx);
                }}
                onDragLeave={() => setDragOverIndex(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverIndex(null);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleReplaceSlot(idx, file);
                }}
              >
                {/* Hidden input for slot-specific replacement */}
                <input
                  type="file"
                  ref={(el) => { replaceInputRefs.current[idx] = el; }}
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleReplaceSlot(idx, file);
                  }}
                />

                {/* Header & Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-stone-100 dark:bg-[#202020] text-stone-700 dark:text-zinc-300 text-[10px] font-mono font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    {isPrimary ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] text-[10px] font-bold uppercase tracking-wider">
                        <Star className="w-3 h-3 fill-current" />
                        Primary Cover
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        className="text-[10px] font-mono text-stone-500 dark:text-zinc-400 hover:text-[#9a7229] dark:hover:text-[#c5a059] transition-colors"
                      >
                        Make Primary
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {hasValue && (
                      <button
                        type="button"
                        onClick={() => setPreviewModalUrl(imgUrl)}
                        className="p-1.5 text-stone-500 hover:text-[#9a7229] dark:hover:text-[#c5a059] transition-colors"
                        title="View Full Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors"
                      title="Remove Image Slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Image Preview & Replacement Box */}
                <div className="flex gap-3 items-center">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-stone-100 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/20 overflow-hidden shrink-0 flex items-center justify-center">
                    {isUploadingThis ? (
                      <div className="flex flex-col items-center justify-center p-2 space-y-1">
                        <Loader2 className="w-5 h-5 animate-spin text-[#9a7229] dark:text-[#c5a059]" />
                        <span className="text-[9px] font-mono font-bold text-[#9a7229] dark:text-[#c5a059]">Uploading...</span>
                      </div>
                    ) : hasValue ? (
                      <img
                        src={imgUrl}
                        alt={`Product ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-stone-400 dark:text-zinc-600 p-2 text-center">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-[9px] font-mono">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Slot Controls */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* URL Input Box */}
                    <input
                      type="url"
                      value={imgUrl}
                      onChange={(e) => handleUpdateImageUrl(idx, e.target.value)}
                      placeholder="https://... or /uploads/..."
                      className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-[#f5f5f1] font-mono placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                    />

                    {/* Replace / Upload Local Button for this slot */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => replaceInputRefs.current[idx]?.click()}
                        disabled={isUploadingThis || disabled}
                        className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-[#202020] border border-stone-200 dark:border-zinc-700 text-stone-800 dark:text-zinc-200 hover:border-[#9a7229] dark:hover:border-[#c5a059] text-[11px] font-medium transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingThis ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-[#9a7229] dark:text-[#c5a059]" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3 h-3 text-[#9a7229] dark:text-[#c5a059]" />
                            <span>{hasValue ? 'Replace From Device' : 'Choose Local File'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Another Slot Button */}
        <button
          type="button"
          onClick={() => onChange([...images, ''])}
          className="w-full py-3 rounded-xl border border-dashed border-stone-300 dark:border-[#c5a059]/30 text-stone-600 dark:text-zinc-400 hover:text-[#9a7229] dark:hover:text-[#c5a059] hover:border-[#9a7229] dark:hover:border-[#c5a059] text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer bg-white/50 dark:bg-[#141414]/50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Another Photo Slot</span>
        </button>
      </div>

      {/* Full Preview Modal */}
      {previewModalUrl && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/30 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#c5a059]/20 pb-3">
              <span className="font-serif font-bold text-xs uppercase tracking-wider text-stone-900 dark:text-[#f5f5f1]">
                Fragrance Image Preview
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="text-stone-500 hover:text-stone-900 dark:hover:text-white font-mono text-sm px-2 py-1"
              >
                ✕ Close
              </button>
            </div>

            <div className="max-h-96 rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <img
                src={previewModalUrl}
                alt="Full Preview"
                referrerPolicy="no-referrer"
                className="max-h-96 w-full object-contain"
              />
            </div>

            <p className="text-[11px] font-mono text-stone-500 dark:text-zinc-400 truncate">
              {previewModalUrl}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
