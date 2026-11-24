import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  computeCameraCaptureDimensions,
  formatCameraPermissionError,
} from './cameraCapture.ts';

describe('computeCameraCaptureDimensions', () => {
  it('scales portrait and landscape frames down so longest side <= 1600px', () => {
    assert.deepEqual(computeCameraCaptureDimensions(3200, 2400), { width: 1600, height: 1200 });
    assert.deepEqual(computeCameraCaptureDimensions(2160, 3840), { width: 900, height: 1600 });
  });

  it('keeps smaller frames unchanged and handles invalid zero dimensions safely', () => {
    assert.deepEqual(computeCameraCaptureDimensions(1280, 720), { width: 1280, height: 720 });
    assert.deepEqual(computeCameraCaptureDimensions(0, 0), { width: 1280, height: 960 });
  });
});

describe('formatCameraPermissionError', () => {
  it('maps permission denied, missing camera, and in-use errors cleanly', () => {
    assert.match(formatCameraPermissionError({ name: 'NotAllowedError' }), /denied/i);
    assert.match(formatCameraPermissionError({ name: 'NotFoundError' }), /No camera/i);
    assert.match(formatCameraPermissionError({ name: 'NotReadableError' }), /in use/i);
    assert.match(formatCameraPermissionError(new Error('Unknown')), /upload a receipt photo/i);
  });
});
