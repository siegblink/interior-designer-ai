"use client";

import { useState, useCallback, useRef } from "react";
import { MAX_FILE_SIZE, ACCEPTED_FILE_TYPES } from "@/lib/constants";

interface UseDropzoneOptions {
  onDrop: (file: File) => void;
  onError?: (error: string) => void;
}

interface UseDropzoneReturn {
  isDragActive: boolean;
  getRootProps: () => {
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onClick: () => void;
  };
  getInputProps: () => {
    type: "file";
    accept: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    ref: React.RefObject<HTMLInputElement | null>;
    style: { display: "none" };
  };
}

export function useDropzone({
  onDrop,
  onError,
}: UseDropzoneOptions): UseDropzoneReturn {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): boolean => {
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        onError?.("Please upload a JPEG or PNG image");
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        onError?.("File size must be less than 5MB");
        return false;
      }
      return true;
    },
    [onError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const file = e.dataTransfer.files[0];
      if (file && validateFile(file)) {
        onDrop(file);
      }
    },
    [onDrop, validateFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        onDrop(file);
      }
    },
    [onDrop, validateFile]
  );

  const getRootProps = useCallback(
    () => ({
      onDragEnter: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
      },
      onDragLeave: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
      },
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
      },
      onDrop: handleDrop,
      onClick: () => inputRef.current?.click(),
    }),
    [handleDrop]
  );

  const getInputProps = useCallback(
    () => ({
      type: "file" as const,
      accept: ACCEPTED_FILE_TYPES.join(","),
      onChange: handleChange,
      ref: inputRef,
      style: { display: "none" as const },
    }),
    [handleChange]
  );

  return {
    isDragActive,
    getRootProps,
    getInputProps,
  };
}
