
import { useState, useEffect } from 'react';
import { days, hours } from '../data/mock-data';
import { Schedule, Teacher } from '../types';
import { getTimeRange } from '../utils/scheduleUtils';
import { ScheduleCell } from './ScheduleCell';

// Filtra le ore per rimuovere 14:30 se presente
const filteredHours = hours.filter(hour => hour !== '14:30');

interface ScheduleTableProps {
  teacher: Teacher;
  editable?: boolean;
  onScheduleChange?: (schedule: Schedule) => void;
  onCellClick?: (day: string, hour: string, value: string) => void;
  selectedDate?: string; // Data selezionata per le sostituzioni
}

export const ScheduleTable = ({ 
  teacher, 
  editable = false, 
  onScheduleChange,
  onCellClick,
  selectedDate
}: ScheduleTableProps) => {
  const [schedule, setSchedule] = useState<Schedule>(teacher.schedule);
  
  // Aggiorniamo lo schedule locale quando cambia il teacher
  useEffect(() => {
    setSchedule(teacher.schedule);
    console.log("ScheduleTable: Teacher changed, updating schedule", teacher.name);
  }, [teacher]);

  const handleCellChange = (day: string, hour: string, value: string) => {
    const newSchedule = {
      ...schedule,
      [day]: {
        ...schedule[day],
        [hour]: value
      }
    };
    
    setSchedule(newSchedule);
    
    if (onScheduleChange) {
      onScheduleChange(newSchedule);
    }
  };

  const handleCellClick = (day: string, hour: string, value: string) => {
    if (!editable && onCellClick) {
      onCellClick(day, hour, value);
    }
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-3 border">Orario</th>
            {days.map(day => (
              <th key={day} className="py-2 px-3 border capitalize">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredHours.map(hour => (
            <tr key={hour}>
              <td className="py-2 px-3 border text-center font-medium">
                {getTimeRange(hour)}
              </td>
              {days.map(day => {
                // Assicuriamoci che cellValue sia sempre una stringa
                let cellValue = schedule[day]?.[hour] || '';
                // Preveniamo la visualizzazione di [object Object]
                if (typeof cellValue === 'object') {
                  cellValue = JSON.stringify(cellValue);
                }
                
                return (
                  <ScheduleCell
                    key={`${day}-${hour}`}
                    day={day}
                    hour={hour}
                    cellValue={cellValue}
                    editable={editable}
                    teacher={teacher}
                    selectedDate={selectedDate}
                    handleCellChange={handleCellChange}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
