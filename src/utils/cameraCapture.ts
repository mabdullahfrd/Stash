/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MAX_CAMERA_CAPTURE_PX = 1600;

/**
 * Computes scaled output dimensions for a captured camera frame while keeping
 * aspect ratio intact and clamping the longest side to maxDimension.
 */
export function computeCameraCaptureDimensions(
  videoWidth: number,
  videoHeight: number,
  maxDimension: number = MAX_CAMERA_CAPTURE_PX
): { width: number; height: number } {
  if (!Number.isFinite(videoWidth) || !Number.isFinite(videoHeight) || videoWidth <= 0 || videoHeight <= 0) {
    return { width: 1280, height: 960 };
  }
  const safeMax = Math.max(1, Math.round(maxDimension));
  const longestSide = Math.max(videoWidth, videoHeight);
  const scale = longestSide > safeMax ? safeMax / longestSide : 1;

  return {
    width: Math.max(1, Math.round(videoWidth * scale)),
    height: Math.max(1, Math.round(videoHeight * scale)),
  };
}

/**
 * Translates WebRTC / getUserMedia camera errors into clear, actionable guidance.
 */
export function formatCameraPermissionError(err: unknown): string {
  const name =
    err && typeof err === 'object' && 'name' in err
      ? String((err as { name?: unknown }).name || '')
      : '';

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Camera access was denied. Allow camera permission in your browser settings or upload a receipt photo instead.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No camera was found on this device. Upload an existing receipt photo instead.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Your camera is currently in use by another app. Close other camera apps or upload a receipt photo instead.';
  }
  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
    return 'Requested camera mode is unavailable on this device. Try flipping cameras or uploading a receipt photo.';
  }
  return 'Could not start the camera on this device. You can upload a receipt photo instead.';
}
