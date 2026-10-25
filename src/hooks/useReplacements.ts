
import { useCallback } from 'react';
import { Replacement } from '../types';
import { useLocalStorage } from './useLocalStorage';

export function useReplacements() {
  const [replacements, setReplacements] = useLocalStorage<Replacement[]>('replacements', []);

  const addReplacement = useCallback((replacement: Replacement) => {
    setReplacements([...replacements, replacement]);
  }, [replacements, setReplacements]);

  const deleteReplacement = useCallback((id: string) => {
    setReplacements(replacements.filter(r => r.id !== id));
  }, [replacements, setReplacements]);

  const getReplacementsByDate = useCallback((date: string) => {
    return replacements.filter(r => r.date === date);
  }, [replacements]);

  return {
    replacements,
    setReplacements,
    addReplacement,
    deleteReplacement,
    getReplacementsByDate
  };
}
