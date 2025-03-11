import { useState } from 'react';
import { FaDownload, FaExpand, FaShare, FaCheck } from "react-icons/fa";
import { saveAs } from "file-saver";
import { ImageModal } from "./ImageModal";

interface ImageWithActionsProps {
  imageUrl: string;
  alt?: string;
  filename?: string;
  containerClassName?: string;
  imageClassName?: string;
}

export function ImageWithActions({ 
  imageUrl, 
  alt = "Image", 
  filename = "image.png",
  containerClassName = "relative",
  imageClassName = "h-full w-full rounded object-cover"
}: ImageWithActionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const downloadImage = () => {
    saveAs(imageUrl, filename);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={containerClassName}>
      <img
        src={imageUrl}
        alt={alt}
        onClick={() => setIsModalOpen(true)}
        className={`cursor-pointer ${imageClassName}`}
      />
      <div className="absolute right-1 top-1 flex space-x-2">
        <button
          onClick={() => setIsModalOpen(true)}
          className="group rounded bg-yellow-500 p-2 text-black"
          title="Expand image"
        >
          <FaExpand className="h-4 w-4 duration-300 group-hover:scale-110" />
        </button>
        <button
          onClick={copyToClipboard}
          className="group rounded bg-yellow-500 p-2 text-black"
          title={copied ? "Copied!" : "Copy share link"}
        >
          {copied ? (
            <FaCheck className="h-4 w-4 duration-300 group-hover:scale-110" />
          ) : (
            <FaShare className="h-4 w-4 duration-300 group-hover:scale-110" />
          )}
        </button>
        <button
          onClick={downloadImage}
          className="group rounded bg-yellow-500 p-2 text-black"
          title="Download image"
        >
          <FaDownload className="h-4 w-4 duration-300 group-hover:scale-110" />
        </button>
      </div>

      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={imageUrl}
      />
    </div>
  );
} 