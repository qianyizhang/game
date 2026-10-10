import { useEffect, useRef, useState } from 'react';
import { disposeObject } from '../../shared/three/resources';
import type { StudyId } from '../catalogue';
import { loadStudy } from '../delivery';
import type { WolfForm } from '../wolfForms';
import { mount, type Options, type Capture } from './controller';

export function download(data: Blob | string, name: string) {
  const url = typeof data === 'string' ? data : URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  if (typeof data !== 'string') setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Viewer({
  id,
  form = 'base',
  options,
  api,
  onTime,
}: {
  id: StudyId;
  form?: WolfForm;
  options: Options;
  api: React.RefObject<Capture | null>;
  onTime: (seconds: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef(options);
  current.current = options;
  const reportTime = useRef(onTime);
  reportTime.current = onTime;
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const element = host.current!;
    const loading = new AbortController();
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    api.current = null;
    setReady(false);
    setFailed(false);
    void loadStudy(id, loading.signal, form)
      .then((loaded) => {
        if (cancelled) {
          disposeObject(loaded.object);
          return;
        }
        const controller = mount({
          element,
          id,
          form,
          loaded,
          getOptions: () => current.current,
          onTime: (seconds) => reportTime.current(seconds),
          onReady: setReady,
          onFailure: () => {
            setFailed(true);
            setReady(false);
          },
        });
        api.current = controller.capture;
        cleanup = () => {
          api.current = null;
          controller.dispose();
        };
      })
      .catch((error: unknown) => {
        cleanup?.();
        if (!cancelled) {
          console.error('Study loading failed', error);
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
      loading.abort();
      cleanup?.();
    };
  }, [id, form, api]);
  return (
    <div className="study-render" ref={host} data-ready={ready}>
      {!ready && !failed && (
        <p className="study-render-message" role="status">
          Preparing the sculpture…
        </p>
      )}
      {failed && (
        <p className="study-render-message" role="alert">
          The sculpture could not be loaded. Reload the gallery to try again, and check that
          graphics acceleration is available. The original artwork is below.
        </p>
      )}
    </div>
  );
}
