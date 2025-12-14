"use client";

import { useState, useEffect, useCallback } from "react";
import { saveAs } from "file-saver";
import { FileRejection } from "react-dropzone";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { SelectMenu } from "@/app/selectmenu";
import { motion, AnimatePresence } from "framer-motion";
import {
  ErrorNotification,
  ActionPanel,
  ImageOutput,
  UploadedImage,
  ImageDropzone,
} from "@/app/components/page-components";

const themes = ["Modern", "Vintage", "Minimalist", "Professional"];
const rooms = ["Living Room", "Dining Room", "Bedroom", "Bathroom", "Office"];

export default function HomePage() {
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>(themes[0]);
  const [room, setRoom] = useState<string>(rooms[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>("");
  const [file, setFile] = useState<File | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  // Handle intro animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Handle image drop
  const onImageDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]): void => {
      if (rejectedFiles.length > 0) {
        setError("Please upload a PNG or JPEG image less than 5MB.");
        return;
      }

      removeImage();
      setError("");
      setFile(acceptedFiles[0]);
      convertImageToBase64(acceptedFiles[0]);
    },
    []
  );

  // Convert image to base64
  const convertImageToBase64 = useCallback((file: File): void => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setBase64Image(reader.result as string);
    };
  }, []);

  // Format file size
  const fileSize = useCallback((size: number): string => {
    if (size === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  // Remove uploaded image
  const removeImage = useCallback((): void => {
    setFile(null);
    setOutputImage(null);
  }, []);

  // Download the output image
  const downloadOutputImage = useCallback((): void => {
    if (outputImage) {
      saveAs(
        outputImage,
        `interior-design-${theme.toLowerCase()}-${room
          .toLowerCase()
          .replace(" ", "-")}.png`
      );
    }
  }, [outputImage, theme, room]);

  // Submit the image to the server
  const submitImage = useCallback(async (): Promise<void> => {
    if (!file) {
      setError("Please upload an image.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/replicate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64Image, theme, room }),
      });

      const result = await response.json();

      if (result.error) {
        setError(result.error);
        return;
      }

      setOutputImage(result.output[1]);
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [file, base64Image, theme, room]);

  return (
    <>
      {/* Intro animation */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.div
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-4xl font-bold text-transparent md:text-6xl"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                Interior Designer AI
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-4 text-gray-400"
              >
                Transform your space with artificial intelligence
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="bg-grid-pattern absolute inset-0 opacity-[0.03]"></div>
        <div className="absolute left-1/2 top-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/20 blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 h-[600px] w-[600px] rounded-full bg-purple-500/20 blur-[100px]"></div>
      </div>

      {/* Main content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex min-h-screen flex-col py-10 lg:pl-72"
      >
        <AnimatePresence>
          {error && <ErrorNotification errorMessage={error} />}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <ActionPanel isLoading={loading} submitImage={submitImage} />
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mx-4 mt-9 flex w-full flex-col space-y-8 md:flex-row md:space-x-8 md:space-y-0 lg:mx-6 xl:mx-8"
        >
          <SelectMenu
            label="Design Style"
            options={themes}
            selected={theme}
            onChange={setTheme}
          />
          <SelectMenu
            label="Room Type"
            options={rooms}
            selected={room}
            onChange={setRoom}
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 grid flex-1 gap-8 px-4 lg:px-6 xl:grid-cols-2 xl:gap-10 xl:px-8"
        >
          <AnimatePresence mode="wait">
            {!file ? (
              <ImageDropzone
                title="Upload your room photo to transform"
                onImageDrop={onImageDrop}
                icon={PhotoIcon}
              />
            ) : (
              <UploadedImage
                image={file}
                removeImage={removeImage}
                file={{ name: file.name, size: fileSize(file.size) }}
              />
            )}
          </AnimatePresence>

          <ImageOutput
            title="Your redesigned space will appear here"
            downloadOutputImage={downloadOutputImage}
            outputImage={outputImage}
            icon={SparklesIcon}
            loading={loading}
          />
        </motion.section>

        {/* How It Works section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="glassmorphism mx-4 mt-12 rounded-2xl border border-gray-800/30 p-6 lg:mx-6 xl:mx-8"
        >
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="gradient-text mb-6 text-xl font-bold"
          >
            How It Works
          </motion.h2>

          <div className="grid gap-8 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="card-hover flex flex-col items-center p-4 text-center"
            >
              <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/20">
                <div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/20"></div>
                <PhotoIcon className="relative z-10 h-7 w-7 text-blue-400" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-white">Upload</h3>
              <p className="text-sm text-gray-400">
                Upload a photo of any room you'd like to redesign
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="card-hover flex flex-col items-center p-4 text-center"
            >
              <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/20">
                <div className="absolute inset-0 animate-pulse rounded-full bg-indigo-500/20"></div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="relative z-10 h-7 w-7 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-white">Customize</h3>
              <p className="text-sm text-gray-400">
                Select your preferred style and room type
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
              className="card-hover flex flex-col items-center p-4 text-center"
            >
              <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/20">
                <div className="absolute inset-0 animate-pulse rounded-full bg-purple-500/20"></div>
                <SparklesIcon className="relative z-10 h-7 w-7 text-purple-400" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-white">Transform</h3>
              <p className="text-sm text-gray-400">
                Our AI generates a stunning new design in seconds
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="mt-8 text-center"
          >
            <span className="text-sm text-gray-400">
              Powered by advanced machine learning models trained on interior
              design principles
            </span>
          </motion.div>
        </motion.section>
      </motion.main>
    </>
  );
}
