
import React, { useState } from 'react';
import { ReplacementModal } from './ReplacementModal';
import { useData } from '../contexts/DataContext';

interface ScheduleCellProps {
  day: string;
  hour: string;
  cellValue: string;
  editable: boolean;
  teacher: any;
  selectedDate?: string;
  handleCellChange?: (day: string, hour: string, value: string) => void;
}

export const ScheduleCell: React.FC<ScheduleCellProps> = ({
  day,
  hour,
  cellValue,
  editable,
  teacher,
  selectedDate,
  handleCellChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { replacements } = useData();

  // Evidenzia in giallo la cella del docente assente per la data selezionata.
  // La sostituzione resta collegata a docente, data e fascia oraria, anche per
  // compresenze, recuperi e variazioni d'orario (che possono non avere un sostituto ID).
  const isReplacementAssigned = (() => {
    if (!selectedDate) return false;
    const [year, month, date] = selectedDate.split('-').map(Number);
    if (!year || !month || !date) return false;
    const selectedDay = new Date(year, month - 1, date).getDay();
    const dayNames = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
    return dayNames[selectedDay] === day && replacements.some(replacement =>
      replacement.date === selectedDate &&
      replacement.absentTeacherId === teacher.id &&
      String(replacement.hour) === String(hour)
    );
  })();

  const handleClick = () => {
    // Apri le opzioni anche cliccando una cella DISP/DIS o una cella vuota.
    if (!editable) setIsModalOpen(true);
  };

  return (
    <>
      <td
        className={`py-2 px-3 border text-center ${
          isReplacementAssigned ? 'bg-yellow-300 text-gray-900' : cellValue ? (
            cellValue === 'DIS' 
              ? 'bg-green-100' 
              : 'bg-blue-100'
          ) : 'bg-gray-50 cursor-pointer hover:bg-gray-100'
        } ${isReplacementAssigned ? 'cursor-pointer hover:bg-yellow-400' : (!editable && cellValue && cellValue !== 'DIS' ? 'cursor-pointer hover:bg-blue-200' : '')}`}
        onClick={handleClick}
      >
        {editable ? (
          <input
            type="text"
            value={cellValue}
            onChange={(e) => handleCellChange && handleCellChange(day, hour, e.target.value)}
            className="w-full bg-transparent text-center focus:outline-none"
            placeholder="-"
          />
        ) : (
          cellValue || '-'
        )}
      </td>

      <ReplacementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        day={day}
        hour={hour}
        className={cellValue}
        teacher={teacher}
        selectedDate={selectedDate}
      />
    </>
  );
};
