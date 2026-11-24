/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, SwitchCamera, X, AlertCircle } from 'lucide-react';
import { ModalShell } from '../common/ModalShell';
import {
  computeCameraCaptureDimensions,
  formatCameraPermissionError,
} from '../../utils/cameraCapture';

interface ReceiptCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  onFallbackUpload: () => void;
}

export const ReceiptCameraModal: React.FC<ReceiptCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  onFallbackUpload,
}) => {
  const titleId = useId();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isStarting, setIsStarting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setCameraError(null);
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      stopStream();
      setCameraError(null);
      setIsStarting(true);

      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setIsStarting(false);
        setCameraError(
          'Live camera preview is not supported in this browser. Upload a receipt photo instead.'
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
          if (!cancelled) {
            setIsReady(true);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setCameraError(formatCameraPermissionError(err));
        }
      } finally {
        if (!cancelled) {
          setIsStarting(false);
        }
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [isOpen, facingMode, stopStream]);

  const handleCaptureFrame = () => {
    const video = videoRef.current;
    if (!video || !isReady) return;

    const { width, height } = computeCameraCaptureDimensions(
      video.videoWidth || 1280,
      video.videoHeight || 960
    );
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    stopStream();
    onClose();
    onCapture(dataUrl);
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} labelledBy={titleId} maxWidthClass="max-w-md">
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 id={titleId} className="text-base font-bold text-[#111315] dark:text-[#F4F5F0]">
              Scan Receipt
            </h3>
            <p className="text-xs text-[#6B7268] dark:text-[#8E9689]">
              Point your camera directly at the receipt to extract items
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close camera"
            className="w-8 h-8 rounded-full bg-[#F4F5F0] dark:bg-white/[0.06] flex items-center justify-center text-[#5E655A] dark:text-[#A4AC9E] hover:text-[#111315] dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Viewfinder */}
        <div className="relative rounded-2xl overflow-hidden bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.08] aspect-[3/4] max-h-[54vh] w-full flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover ${isReady && !cameraError ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Receipt Framing Corners */}
          {isReady && !cameraError && (
            <div className="pointer-events-none absolute inset-5">
              <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#C8EC45] rounded-tl-lg" />
              <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#C8EC45] rounded-tr-lg" />
              <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#C8EC45] rounded-bl-lg" />
              <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#C8EC45] rounded-br-lg" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-black/65 text-[11px] font-medium text-white whitespace-nowrap">
                Align store name, items &amp; total
              </div>
            </div>
          )}

          {isStarting && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-[#C8EC45]" />
              <span>Starting camera…</span>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-xs text-white/85 leading-relaxed max-w-xs">{cameraError}</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onFallbackUpload();
                }}
                className="px-4 py-2.5 rounded-xl bg-[#C8EC45] hover:bg-[#B8DE35] text-[#111315] text-xs font-semibold flex items-center gap-2 transition"
              >
                <ImagePlus className="w-4 h-4" />
                <span>Upload Receipt Photo</span>
              </button>
            </div>
          )}
        </div>

        {/* Camera Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
            disabled={isStarting || Boolean(cameraError)}
            aria-label="Switch camera"
            className="h-11 px-3.5 rounded-xl bg-[#F4F5F0] dark:bg-white/[0.06] text-[#111315] dark:text-[#F4F5F0] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.1] transition disabled:opacity-40 shrink-0"
          >
            <SwitchCamera className="w-4 h-4" />
            <span>Flip</span>
          </button>

          <button
            type="button"
            onClick={handleCaptureFrame}
            disabled={!isReady || Boolean(cameraError)}
            className="flex-1 h-11 px-4 rounded-xl bg-[#C8EC45] hover:bg-[#B8DE35] text-[#111315] text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-40"
          >
            <Camera className="w-4 h-4" />
            <span>Capture &amp; Scan Receipt</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onFallbackUpload();
            }}
            className="h-11 px-3.5 rounded-xl bg-[#F4F5F0] dark:bg-white/[0.06] text-[#5E655A] dark:text-[#A4AC9E] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.1] transition shrink-0"
          >
            <ImagePlus className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </button>
        </div>
      </div>
    </ModalShell>
  );
};
