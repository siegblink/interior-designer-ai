'use client';

import { useState } from 'react';
import { saveAs } from 'file-saver';
import { ThreeDots } from 'react-loader-spinner';
import { FaTrashAlt, FaDownload } from 'react-icons/fa';
import Dropzone, { FileRejection } from 'react-dropzone';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);

  const acceptedFileTypes = {
    'image/jpeg': ['.jpeg', '.jpg', '.png'],
  };

  const maxFileSize = 5 * 1024 * 1024;

  function onDrop(acceptedFiles: File[], rejectedFiles: FileRejection[]) {
    // Check if any of the uploaded files are not valid
    if (rejectedFiles.length > 0) {
      console.log(rejectedFiles);
      setError('Please upload a PNG or JPEG image less than 5MB.');
      return;
    }

    removeImage();

    console.log(acceptedFiles);
    setError('');
    setFile(acceptedFiles[0]);

    // Convert to base64
    const reader = new FileReader();
    reader.readAsDataURL(acceptedFiles[0]);
    reader.onload = () => {
      const binaryStr = reader.result as string;
      setBase64Image(binaryStr);
    };
  }

  function fileSize(size: number) {
    if (size === 0) {
      return '0 Bytes';
    }

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(k));

    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function removeImage() {
    setFile(null);
    setOutputImage(null);
  }

  async function submitImage() {
    setLoading(true);

    const response = await fetch('/api/replicate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image }),
    });

    const result = await response.json();
    console.log(result);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setOutputImage(result.output);
    setLoading(false);
  }

  function downloadOutputImage() {
    saveAs(outputImage as string, 'output.png');
  }

  return (
    <main className='max-w-3xl mx-auto my-10 px-4'>
      {/* Header section */}
      <section className='text-center mb-10'>
        <h1 className='font-semibold text-transparent text-5xl bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 inline-block bg-clip-text'>
          Remove background
        </h1>
      </section>

      {/* Dropzone section */}
      <section className='w-full max-w-lg mx-auto mb-12'>
        {/* Dropzone */}
        <div className='w-full text-center border-4 border-gray-500 border-dashed rounded-md cursor-pointer mb-2 text-gray-500'>
          <Dropzone
            accept={acceptedFileTypes}
            multiple={false}
            maxSize={maxFileSize}
            onDrop={onDrop}
          >
            {({ getRootProps, getInputProps }) => (
              <section>
                <div className='p-10' {...getRootProps()}>
                  <input {...getInputProps()} />
                  <p>Drag 'n' drop some files here, or click to select files</p>
                </div>
              </section>
            )}
          </Dropzone>
        </div>

        {/* Error message */}
        {error && (
          <div className='flex justify-center'>
            <p className='text-md text-yellow-500'>{error}</p>
          </div>
        )}

        {/* Submit button */}
        {file && (
          <div className='flex items-center justify-center mt-2'>
            <button
              onClick={submitImage}
              disabled={loading}
              className={`text-white text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l rounded-lg px-4 py-2 text-center mb-2 ${
                loading && 'cursor-progress'
              }`}
            >
              Remove background
            </button>
          </div>
        )}
      </section>

      {/* Images section */}
      <section className='grid grid-cols-2 gap-4 mt-4'>
        {file && (
          <>
            <div className='relative'>
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className='object-cover w-full h-full'
              />
              <button
                className='absolute top-0 right-0 p-2 text-black bg-yellow-500'
                onClick={removeImage}
              >
                <FaTrashAlt className='w-4 h-4 hover:scale-125 duration-300' />
              </button>

              <div className='absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-50 text-white text-md p-2'>
                {file.name} ({fileSize(file.size)})
              </div>
            </div>

            <div className='flex items-center justify-center relative'>
              {loading && (
                <ThreeDots
                  height='60'
                  width='60'
                  color='#eee'
                  ariaLabel='three-dots-loading'
                  visible={loading}
                />
              )}

              {outputImage && (
                <>
                  <img
                    src={outputImage}
                    alt='output'
                    className='object-cover w-full h-full'
                  />
                  <button
                    onClick={downloadOutputImage}
                    className='absolute top-0 right-0 p-3 text-black bg-yellow-500'
                  >
                    <FaDownload className='w-6 h-6 hover:scale-125 duration-300' />
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
