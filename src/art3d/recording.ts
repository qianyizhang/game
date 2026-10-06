/** Record actual rendered frames; cancel on navigation or a hidden tab. */
export async function recordLoop(
  canvas: HTMLCanvasElement,
  render: (seconds: number) => void,
  duration: number,
  signal: AbortSignal,
) {
  const cancelled = () =>
    new Error('Recording cancelled. Keep the gallery visible while recording.');
  if (signal.aborted || document.hidden) throw cancelled();
  if (!canvas.captureStream || typeof MediaRecorder === 'undefined')
    throw new Error(
      'Video recording is unavailable in this browser. Download the animated GLB instead.',
    );
  const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((type) =>
    MediaRecorder.isTypeSupported(type),
  );
  if (!mimeType)
    throw new Error(
      'WebM recording is unavailable in this browser. Download the animated GLB instead.',
    );
  render(0);
  const stream = canvas.captureStream(30);
  try {
    return await new Promise<Blob>((resolve, reject) => {
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
      const chunks: Blob[] = [];
      let frame = 0,
        started: number | undefined,
        settled = false;
      const abort = () => finish(cancelled());
      const visible = () => {
        if (document.hidden) abort();
      };
      const cleanup = () => {
        cancelAnimationFrame(frame);
        signal.removeEventListener('abort', abort);
        document.removeEventListener('visibilitychange', visible);
        recorder.ondataavailable = recorder.onerror = recorder.onstop = null;
      };
      const finish = (error?: unknown) => {
        if (settled) return;
        settled = true;
        // Stop drawing synchronously: the viewer may dispose its scene before
        // MediaRecorder dispatches its asynchronous stop event.
        cleanup();
        try {
          if (recorder.state !== 'inactive') recorder.stop();
        } catch (stopError) {
          error ??= stopError;
        }
        if (error) reject(error);
        else if (!chunks.length)
          reject(new Error('No video frames were recorded. Please try again.'));
        else resolve(new Blob(chunks, { type: 'video/webm' }));
      };
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => {
        finish(new Error('Video recording failed. Download the animated GLB instead.'));
      };
      recorder.onstop = () => finish();
      signal.addEventListener('abort', abort, { once: true });
      document.addEventListener('visibilitychange', visible);
      const tick = (now: number) => {
        if (settled) return;
        try {
          started ??= now;
          const seconds = (now - started) / 1000;
          render(Math.min(duration, seconds));
          if (seconds >= duration) recorder.stop();
          else frame = requestAnimationFrame(tick);
        } catch (error) {
          finish(error);
        }
      };
      try {
        recorder.start(250);
        frame = requestAnimationFrame(tick);
        if (signal.aborted || document.hidden) abort();
      } catch (error) {
        finish(error);
      }
    });
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
}
