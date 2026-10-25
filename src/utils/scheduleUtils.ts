
/**
 * Utility functions for working with schedules
 */

// Funzione per formattare una data in formato locale
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Funzione per convertire un'ora in fascia oraria
export function getTimeRange(hour: string): string {
  const hourMap: Record<string, string> = {
    '8:30': '8:30-9:30',
    '9:30': '9:30-10:30',
    '10:30': '10:30-11:30',
    '11:30': '11:30-12:30',
    '12:30': '12:30-13:30',
    '13:30': '13:30-14:30'
  };
  
  return hourMap[hour] || hour;
}

// Lista delle opzioni speciali per le sostituzioni
export const SPECIAL_REPLACEMENT_OPTIONS = [
  "Entra alle 9:30",
  "Entra alle 10:30",
  "Esce alle 10:30",
  "Esce alle 11:30",
  "Esce alle 12:30", 
  "Esce alle 13:30",
  "No DIS"
];

// Verifica se un docente è disponibile in un determinato giorno e ora
export function isTeacherAvailable(teacher: any, day: string, hour: string): boolean {
  if (!teacher) return false;
  // Se il docente non ha lezione in questa ora (cella vuota o non definita), è disponibile
  return !teacher.schedule[day] || !teacher.schedule[day][hour];
}
