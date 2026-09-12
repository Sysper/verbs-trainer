import { useCallback, useEffect, useState } from 'react';
import {
  emptyProgress,
  loadProgress,
  type Progress,
  recordAnswer,
  saveProgress,
} from '../lib/storage';

/** Progress state, mirrored to localStorage on every change. */
export function useProgress() {
  const [progress, setProgress] = useState<Progress>(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const record = useCallback((id: string, correct: boolean) => {
    setProgress((p) => recordAnswer(p, id, correct));
  }, []);

  const reset = useCallback(() => setProgress(emptyProgress()), []);

  return { progress, record, reset };
}
