import { XCircleIcon } from "@heroicons/react/20/solid";
import { PhotoIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { FaTrashAlt, FaDownload } from "react-icons/fa";
import { ThreeDots } from "react-loader-spinner";
import { motion, AnimatePresence } from "framer-motion";
import Dropzone from "react-dropzone";
import { ImageAreaProps } from "@/types";
import { FileRejection } from "react-dropzone";

type ErrorNotificationProps = {
  errorMessage: string;
};

type ActionPanelProps = {
  isLoading: boolean;
  submitImage(): void;
};

type UploadedImageProps = {
  image: File;
  removeImage(): void;
  file: {
    name: string;
    size: string;
  };
};

type ImageOutputProps = ImageAreaProps & {
  loading: boolean;
  outputImage: string | null;
  downloadOutputImage(): void;
};

const acceptedFileTypes = {
  "image/jpeg": [".jpeg", ".jpg", ".png"],
};

const maxFileSize = 5 * 1024 * 1024; // 5MB

/**
 * Display an error notification
 */
function ErrorNotification({ errorMessage }: ErrorNotificationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-4 mb-10 rounded-xl border border-red-800/50 bg-red-900/20 p-5 shadow-[0_0_15px_rgba(220,38,38,0.2)] backdrop-blur-lg lg:mx-6 xl:mx-8"
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="rounded-full bg-red-900/50 p-2">
            <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-red-400">{errorMessage}</p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Display the action panel
 */
function ActionPanel({ isLoading, submitImage }: ActionPanelProps) {
  const isDisabled = isLoading;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-4 overflow-hidden rounded-2xl border border-gray-800/30 bg-gray-900/30 shadow-xl backdrop-blur-lg lg:mx-6 xl:mx-8"
    >
      <div className="px-6 py-6 sm:p-8">
        <div className="sm:flex sm:items-start sm:justify-between">
          <div>
            <motion.h3
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-lg font-bold leading-6 text-transparent lg:text-xl"
            >
              Transform Your Space
            </motion.h3>
            <div className="mt-2 max-w-xl text-sm text-gray-300">
              <p>
                Upload a photo of your room and let our AI generate a stunning
                redesign.
              </p>
            </div>
          </div>
          <div className="mt-5 sm:ml-6 sm:mt-0 sm:flex sm:flex-shrink-0 sm:items-center">
            <motion.button
              whileHover={{
                scale: 1.02,
                boxShadow: "0 0 20px rgba(79, 70, 229, 0.4)",
              }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={isDisabled}
              onClick={submitImage}
              className={`${
                isDisabled
                  ? "cursor-not-allowed bg-indigo-800/50 text-gray-300"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500"
              } inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold shadow-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 lg:px-5 lg:py-3`}
            >
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center"
                >
                  <ThreeDots
                    height="20"
                    width="30"
                    color="#ccc"
                    ariaLabel="loading"
                    visible={true}
                  />
                  <span className="ml-2">Generating Design...</span>
                </motion.div>
              ) : (
                <>
                  <span>Design this room</span>
                  <SparklesIcon className="ml-2 h-5 w-5 text-indigo-200" />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/**
 * Display the image output
 */
function ImageOutput(props: ImageOutputProps) {
  return (
    <motion.section
      layout
      className="relative min-h-[350px] w-full overflow-hidden rounded-2xl border border-gray-800/50 bg-gray-900/30 shadow-2xl backdrop-blur-sm"
    >
      <AnimatePresence mode="wait">
        {!props.outputImage && props.loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500 opacity-30 blur-md"></div>
                <ThreeDots
                  height="60"
                  width="80"
                  color="#eee"
                  ariaLabel="three-dots-loading"
                  visible={props.loading}
                />
              </div>
              <div className="flex flex-col items-center space-y-1">
                <span className="block text-sm font-semibold text-indigo-300">
                  AI at work
                </span>
                <span className="text-xs text-gray-400">
                  This may take a few moments...
                </span>
              </div>
            </div>
          </motion.div>
        ) : null}

        {!props.outputImage && !props.loading ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6"
          >
            <div className="relative mb-4 h-20 w-20">
              <div className="absolute inset-0 animate-pulse rounded-full bg-indigo-500/20"></div>
              <div className="relative flex h-full w-full items-center justify-center">
                <props.icon className="h-10 w-10 text-indigo-300" />
              </div>
            </div>
            <span className="max-w-xs text-center text-sm font-medium text-gray-200">
              {props.title}
            </span>
            <span className="mt-2 text-xs text-gray-400">
              The output will be an AI-generated redesign of your space
            </span>
          </motion.div>
        ) : null}

        {!props.loading && props.outputImage ? (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <img
              src={props.outputImage}
              alt="AI Generated Design"
              className="h-full w-full object-cover transition-all duration-300"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50"></div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!props.loading && props.outputImage ? (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{
            scale: 1.1,
            boxShadow: "0 0 15px rgba(59, 130, 246, 0.6)",
          }}
          whileTap={{ scale: 0.9 }}
          onClick={props.downloadOutputImage}
          className="absolute bottom-4 right-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 p-3 text-white shadow-xl"
        >
          <FaDownload className="h-5 w-5" />
        </motion.button>
      ) : null}
    </motion.section>
  );
}

/**
 * Display the uploaded image
 */
function UploadedImage({ file, image, removeImage }: UploadedImageProps) {
  return (
    <motion.section
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-[350px] w-full overflow-hidden rounded-2xl border border-gray-800/50 bg-gray-900/30 shadow-2xl"
    >
      <img
        src={URL.createObjectURL(image)}
        alt={image.name}
        className="h-full w-full object-cover transition-all duration-300"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"></div>

      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{
          scale: 1.1,
          boxShadow: "0 0 15px rgba(239, 68, 68, 0.6)",
        }}
        whileTap={{ scale: 0.9 }}
        className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-red-500 to-rose-500 p-3 text-white shadow-xl"
        onClick={removeImage}
      >
        <FaTrashAlt className="h-5 w-5" />
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-0 left-0 right-0 bg-black/60 p-4 text-white backdrop-blur-sm"
      >
        <div className="truncate text-sm font-medium">{file.name}</div>
        <div className="mt-1 text-xs text-gray-300">{file.size}</div>
      </motion.div>
    </motion.section>
  );
}

/**
 * Display the image dropzone
 */
function ImageDropzone(
  props: ImageAreaProps & {
    onImageDrop(acceptedFiles: File[], rejectedFiles: FileRejection[]): void;
  }
) {
  return (
    <Dropzone
      onDrop={props.onImageDrop}
      accept={acceptedFileTypes}
      maxSize={maxFileSize}
      multiple={false}
    >
      {({ getRootProps, getInputProps, isDragActive }) => (
        <>
          <input {...getInputProps()} />
          <div
            {...getRootProps()}
            className={`relative min-h-[350px] w-full rounded-2xl border-2 border-dashed ${
              isDragActive
                ? "border-indigo-400 bg-indigo-900/20"
                : "border-gray-700 bg-gray-900/30"
            } flex flex-col items-center justify-center p-8 text-center shadow-2xl backdrop-blur-sm transition-colors duration-200`}
          >
            <div
              className={`flex flex-col items-center ${
                isDragActive ? "animate-bounce-subtle" : ""
              }`}
            >
              <div className="relative mb-4 h-20 w-20">
                <div
                  className={`absolute inset-0 rounded-full ${
                    isDragActive ? "bg-indigo-500/30" : "bg-gray-800/50"
                  } animate-pulse`}
                ></div>
                <div className="relative flex h-full w-full items-center justify-center">
                  <props.icon
                    className={`h-10 w-10 ${
                      isDragActive ? "text-indigo-300" : "text-gray-400"
                    }`}
                  />
                </div>
              </div>

              <span
                className={`text-sm font-medium ${
                  isDragActive ? "text-indigo-200" : "text-gray-300"
                } max-w-xs`}
              >
                {isDragActive ? "Drop your image here..." : props.title}
              </span>

              {!isDragActive && (
                <span className="mt-2 text-xs text-gray-500">
                  Supports JPEG, JPG, and PNG (max 5MB)
                </span>
              )}

              {!isDragActive && (
                <div className="mt-6">
                  <span className="inline-flex h-8 items-center rounded-full bg-blue-900/20 px-3 text-xs font-medium text-blue-300">
                    Click or drag to upload
                  </span>
                </div>
              )}
            </div>

            {/* Animated border effect when dragging */}
            {isDragActive && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20"></div>
                <div className="absolute left-0 top-0 h-[3px] w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                <div className="absolute bottom-0 left-0 h-[3px] w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>
                <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500"></div>
                <div className="absolute right-0 top-0 h-full w-[3px] bg-gradient-to-b from-purple-500 via-indigo-500 to-blue-500"></div>
              </div>
            )}
          </div>
        </>
      )}
    </Dropzone>
  );
}

export {
  ErrorNotification,
  ActionPanel,
  ImageOutput,
  UploadedImage,
  ImageDropzone,
};
