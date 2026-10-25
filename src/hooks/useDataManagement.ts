
import { useCallback } from 'react';
import { useToast } from './use-toast';
import { mockTeachers } from '../data/mock-data';

export function useDataManagement(
  setTeachers: (teachers: any[]) => void,
  setReplacements: (replacements: any[]) => void
) {
  const { toast } = useToast();

  const clearAllData = useCallback(() => {
    try {
      if (window.confirm('Sei sicuro di voler eliminare tutti i dati? Questa azione non può essere annullata.')) {
        // Pulisci localStorage
        localStorage.removeItem('teachers');
        localStorage.removeItem('replacements');
        
        console.log('LocalStorage svuotato. Ripristino dei dati predefiniti...');
        
        // Reimposta gli stati con i valori predefiniti
        setTeachers([...mockTeachers]);
        setReplacements([]);
        
        // Mostra toast di conferma
        toast({
          title: "Dati eliminati",
          description: "Tutti i dati sono stati eliminati con successo",
        });
        
        // Ricarica la pagina dopo un breve ritardo
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Errore durante la pulizia dei dati:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione dei dati",
        variant: "destructive",
      });
    }
  }, [setTeachers, setReplacements, toast]);

  const exportData = useCallback((teachers: any[], replacements: any[]) => {
    return JSON.stringify({ teachers, replacements });
  }, []);

  const importData = useCallback((data: string): boolean => {
    try {
      const parsedData = JSON.parse(data);
      
      // Verifica e prepara i dati degli insegnanti
      if (parsedData.teachers) {
        // Assicuriamoci che ogni insegnante abbia le proprietà necessarie
        const validatedTeachers = parsedData.teachers.map((teacher: any) => {
          // Assicuriamoci che l'insegnante abbia un array permissions
          if (!teacher.permissions) {
            teacher.permissions = [];
          }
          
          // Assicuriamoci che l'orario abbia la struttura corretta
          if (!teacher.schedule) {
            teacher.schedule = {};
          }
          
          return teacher;
        });
        
        setTeachers(validatedTeachers);
      }
      
      // Verifica e prepara le sostituzioni
      if (parsedData.replacements) {
        // Assicuriamoci che ogni sostituzione abbia le proprietà necessarie
        const validatedReplacements = parsedData.replacements.map((replacement: any) => {
          // Assicuriamoci che il campo className esista
          if (!replacement.className) {
            replacement.className = "";
          }
          
          return replacement;
        });
        
        setReplacements(validatedReplacements);
      }
      
      // Mostra un toast di conferma
      toast({
        title: "Dati importati",
        description: "I dati sono stati importati con successo",
      });
      
      return true;
    } catch (error) {
      console.error('Errore durante l\'importazione dei dati:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'importazione dei dati",
        variant: "destructive",
      });
      return false;
    }
  }, [setTeachers, setReplacements, toast]);

  return {
    clearAllData,
    exportData,
    importData
  };
}
