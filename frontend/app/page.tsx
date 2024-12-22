"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { DownloadIcon, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [originalImages, setOriginalImages] = useState<string[]>([]);
  const [processedImages, setProcessedImages] = useState<(string | null)[]>([]);
  const [processingStatus, setProcessingStatus] = useState<boolean[]>([]);
  const [processingTimes, setProcessingTimes] = useState<(number | null)[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const imageUrls = files.map((file) => URL.createObjectURL(file));
      setOriginalImages(imageUrls);
      setProcessedImages(new Array(files.length).fill(null));
      setProcessingStatus(new Array(files.length).fill(false));
      setProcessingTimes(new Array(files.length).fill(null));
    }
  };

  const handleRemoveBackground = async () => {
    if (originalImages.length === 0) return;

    // Reset states for new processing
    setProcessedImages(new Array(originalImages.length).fill(null));
    setProcessingStatus(new Array(originalImages.length).fill(true));
    setProcessingTimes(new Array(originalImages.length).fill(null));

    // Process each image independently
    originalImages.forEach(async (imageUrl, index) => {
      const startTime = Date.now();

      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const formData = new FormData();
        formData.append("file", blob, `image${index}.png`);

        const result = await fetch("http://localhost:8000/remove-background/", {
          method: "POST",
          body: formData,
        });

        if (!result.ok) throw new Error(`Failed to process image ${index}`);

        const processedBlob = await result.blob();
        const processedUrl = URL.createObjectURL(processedBlob);
        const processingTime = (Date.now() - startTime) / 1000;

        // Update states for this specific image
        setProcessedImages((prev) => {
          const newProcessedImages = [...prev];
          newProcessedImages[index] = processedUrl;
          return newProcessedImages;
        });

        setProcessingTimes((prev) => {
          const newProcessingTimes = [...prev];
          newProcessingTimes[index] = processingTime;
          return newProcessingTimes;
        });
      } catch (error) {
        console.error(`Error processing image ${index}:`, error);
      } finally {
        setProcessingStatus((prev) => {
          const newStatus = [...prev];
          newStatus[index] = false;
          return newStatus;
        });
      }
    });
  };

  const handleDownload = async () => {
    // Get only the completed images
    const completedImages = processedImages.filter(
      (img): img is string => img !== null
    );
    if (completedImages.length === 0) return;

    // If any images are still processing, get user confirmation
    const stillProcessing = processingStatus.some((status) => status);
    if (stillProcessing) {
      const confirmed = window.confirm(
        "Some images are still processing. Do you want to download only the completed images?"
      );
      if (!confirmed) return;
    }

    // Single image download
    if (completedImages.length === 1) {
      const link = document.createElement("a");
      link.href = completedImages[0];
      link.download = "processed-image.png";
      link.click();
      return;
    }

    // Multiple images download
    const zip = new JSZip();
    try {
      // Keep track of actual indices for naming
      const completedIndices = processedImages
        .map((img, index) => (img !== null ? index : null))
        .filter((index): index is number => index !== null);

      await Promise.all(
        completedImages.map(async (imageUrl, arrayIndex) => {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          // Use the actual image index for naming
          const originalIndex = completedIndices[arrayIndex];
          zip.file(`processed-image-${originalIndex + 1}.png`, blob);
        })
      );
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "processed-images.zip");
    } catch (error) {
      console.error("Error creating zip file:", error);
    }
  };

  const isAnyProcessing = processingStatus.some((status) => status);
  const hasCompletedImages = processedImages.some((img) => img !== null);

  return (
    <div className="min-h-screen p-8 flex flex-col items-center gap-8">
      <main className="max-w-5xl w-full flex flex-col items-center gap-8">
        <h1 className="text-2xl font-bold">Image Background Remover</h1>

        <div className="w-full">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            id="imageInput"
            disabled={isAnyProcessing}
          />
          <div
            onClick={() => document.getElementById("imageInput")?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            <div className="text-center">
              <p className="text-gray-600">
                Drag and drop images here, or click to select files
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supports multiple images
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-row gap-2">
          {originalImages.length > 0 && (
            <Button onClick={handleRemoveBackground} disabled={isAnyProcessing}>
              <ImageIcon className="w-4 h-4 mr-2" />
              {isAnyProcessing && "Processing..."}
              {!isAnyProcessing && hasCompletedImages && "Re-process"}
              {!isAnyProcessing && !hasCompletedImages && "Remove Background"}
            </Button>
          )}
          {hasCompletedImages && (
            <Button onClick={handleDownload}>
              <DownloadIcon className="w-4 h-4 mr-2" />
              Download {isAnyProcessing ? "Completed " : ""}Images
              {isAnyProcessing &&
                ` (${processedImages.filter((img) => img !== null).length}/${
                  originalImages.length
                })`}
            </Button>
          )}
        </div>

        {originalImages.length > 0 && (
          <div className="grid grid-cols-2 gap-8 w-full">
            <div className="flex flex-col gap-4">
              <h2 className="font-semibold">Original</h2>
              <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                {originalImages.map((img, index) => (
                  <div
                    key={`original-${index}`}
                    className="flex flex-col gap-2"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={img}
                        alt={`Original image ${index + 1}`}
                        fill
                        className="object-contain"
                      />
                    </div>
                    {processingTimes[index] && (
                      <p className="text-sm text-gray-500 text-center">
                        Processed in {processingTimes[index]?.toFixed(1)}s
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="font-semibold">Processed</h2>
              <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                {originalImages.map((_, index) => (
                  <div
                    key={`processed-${index}`}
                    className="flex flex-col gap-2"
                  >
                    {processingStatus[index] ? (
                      <>
                        <Skeleton className="aspect-square w-full rounded-lg" />
                        <p className="text-sm text-gray-500 text-center">
                          Processing...
                        </p>
                      </>
                    ) : processedImages[index] ? (
                      <>
                        <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <Image
                            src={processedImages[index]!}
                            alt={`Processed image ${index + 1}`}
                            fill
                            className="object-contain"
                          />
                        </div>
                        {processingTimes[index] && (
                          <p className="text-sm text-gray-500 text-center">
                            Processed in {processingTimes[index]?.toFixed(1)}s
                          </p>
                        )}
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <p className="text-sm text-gray-500">
          Built with ❤️ at{" "}
          <a
            href="https://langtrace.ai"
            className="underline text-blue-500"
            target="_blank"
          >
            Langtrace
          </a>{" "}
          by{" "}
          <a
            href="https://x.com/karthikkalyan90"
            className="underline text-blue-500"
            target="_blank"
          >
            Karthik Kalyanaraman
          </a>
        </p>
      </main>
    </div>
  );
}
