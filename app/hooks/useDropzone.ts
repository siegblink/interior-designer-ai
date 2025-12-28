import { useState, useCallback, DragEvent, ChangeEvent } from "react";

export type FileRejection = {
  file: File;
  errors: Array<{ code: string; message: string }>;
};

export type UseDropzoneOptions = {
  accept?: Record<string, string[]>;
  maxSize?: number;
  multiple?: boolean;
  onDrop?: (acceptedFiles: File[], rejectedFiles: FileRejection[]) => void;
};

export function useDropzone(options: UseDropzoneOptions) {
  const [isDragActive, setIsDragActive] = useState(false);

  // Validate files based on type and size
  const validateFiles = useCallback(
    (files: File[]) => {
      const acceptedFiles: File[] = [];
      const rejectedFiles: FileRejection[] = [];

      // Limit to single file if multiple is false
      const filesToProcess = options.multiple ? files : files.slice(0, 1);

      filesToProcess.forEach((file) => {
        const errors: Array<{ code: string; message: string }> = [];

        // Validate file type
        if (options.accept) {
          const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
          const fileMimeType = file.type;

          let isValidType = false;

          // Check if file type or extension matches accepted types
          Object.entries(options.accept).forEach(([mimeType, extensions]) => {
            if (
              fileMimeType === mimeType ||
              extensions.includes(fileExtension)
            ) {
              isValidType = true;
            }
          });

          if (!isValidType) {
            errors.push({
              code: "file-invalid-type",
              message: `File type ${fileMimeType || fileExtension} is not accepted`,
            });
          }
        }

        // Validate file size
        if (options.maxSize && file.size > options.maxSize) {
          errors.push({
            code: "file-too-large",
            message: `File size ${file.size} exceeds maximum size ${options.maxSize}`,
          });
        }

        // Add to appropriate array
        if (errors.length > 0) {
          rejectedFiles.push({ file, errors });
        } else {
          acceptedFiles.push(file);
        }
      });

      return { acceptedFiles, rejectedFiles };
    },
    [options.accept, options.maxSize, options.multiple]
  );

  // Handle drag enter event
  const onDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  // Handle drag leave event
  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set to false if we're leaving the dropzone entirely
    // Check if the related target is not a child of the current target
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragActive(false);
    }
  }, []);

  // Handle drag over event
  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Handle drop event
  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      const { acceptedFiles, rejectedFiles } = validateFiles(files);

      if (options.onDrop) {
        options.onDrop(acceptedFiles, rejectedFiles);
      }
    },
    [validateFiles, options.onDrop]
  );

  // Handle file input change event
  const onFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      const { acceptedFiles, rejectedFiles } = validateFiles(files);

      if (options.onDrop) {
        options.onDrop(acceptedFiles, rejectedFiles);
      }

      // Reset input value to allow selecting the same file again
      e.target.value = "";
    },
    [validateFiles, options.onDrop]
  );

  // Return props getters and state
  return {
    getRootProps: () => ({
      onDragEnter,
      onDragLeave,
      onDragOver,
      onDrop,
    }),
    getInputProps: () => ({
      type: "file" as const,
      onChange: onFileInputChange,
      accept: options.accept
        ? Object.values(options.accept).flat().join(",")
        : undefined,
      multiple: options.multiple,
      style: { display: "none" },
    }),
    isDragActive,
  };
}
