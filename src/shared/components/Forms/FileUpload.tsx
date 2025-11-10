import React, { useRef } from 'react';
import clsx from 'clsx';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface FileUploadProps {
  label?: string;
  error?: string;
  helperText?: string;
  accept?: string;
  onChange: (file: File | null) => void;
  value?: File | null;
  previewUrl?: string;
}

function FileUpload({
  label,
  error,
  helperText,
  accept = 'image/*',
  onChange,
  value,
  previewUrl,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="mt-1 flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10">
        <div className="text-center">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="mx-auto h-32 w-32 object-cover rounded-lg"
            />
          ) : (
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          )}
          <div className="mt-4 flex text-sm leading-6 text-gray-600">
            <button
              type="button"
              onClick={handleClick}
              className="relative cursor-pointer rounded-md bg-white font-semibold text-primary-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-600 focus-within:ring-offset-2 hover:text-primary-500"
            >
              <span>Upload a file</span>
              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                accept={accept}
                onChange={handleFileChange}
              />
            </button>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
}

export default FileUpload;

