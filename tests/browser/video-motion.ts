/** Inspect actual presented frames; encoded size and frame intervals vary by runner. */
export async function inspectVideoMotion(url: string, timeout: number) {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.style.cssText = 'position:fixed;bottom:0;right:0;width:200px';
  document.body.append(video);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  let first: Uint8ClampedArray | undefined;
  let frames = 0;
  let moving = false;
  let callback = 0;
  let settled = false;
  let timer = 0;
  try {
    return await new Promise<{ width: number; height: number; frames: number; moving: boolean }>(
      (resolve, reject) => {
        const finish = (error?: Error) => {
          if (settled) return;
          settled = true;
          if (error) reject(error);
          else resolve({ width: video.videoWidth, height: video.videoHeight, frames, moving });
        };
        const capture: VideoFrameRequestCallback = () => {
          if (settled) return;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
          frames++;
          if (first) moving = pixels.some((value, index) => value !== first![index]);
          else first = pixels;
          if (moving) finish();
          else callback = video.requestVideoFrameCallback(capture);
        };
        timer = window.setTimeout(() => finish(new Error('Video playback timed out')), timeout);
        video.onerror = () => finish(new Error('Video decoding failed'));
        video.onended = () => finish();
        callback = video.requestVideoFrameCallback(capture);
        video.src = url;
        void video
          .play()
          .catch((error: unknown) =>
            finish(error instanceof Error ? error : new Error('Video playback failed')),
          );
      },
    );
  } finally {
    window.clearTimeout(timer);
    video.cancelVideoFrameCallback(callback);
    video.onended = null;
    video.onerror = null;
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.remove();
  }
}
