import { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { ScheduleTable } from '../components/ScheduleTable';
import { Teacher } from '../types';
import { Calendar as CalendarIcon, Search } from 'lucide-react';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Button } from '../components/ui/button';
import { format } from 'date-fns';
import { formatLocalDate } from '../utils/scheduleUtils';

export const SostituzioniPage = () => {
  const { teachers } = useData();
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const navigate = useNavigate();
  
  // Filtra i docenti in base al termine di ricerca
  const filteredTeachers = searchTerm.trim()
    ? teachers.filter(teacher =>
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teacherId = e.target.value;
    if (teacherId === '') {
      setSelectedTeacher(null);
      return;
    }
    const teacher = teachers.find(t => t.id === teacherId);
    if (teacher) {
      setSelectedTeacher(teacher);
    } else {
      setSelectedTeacher(null);
    }
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setSearchActive(true);
  };

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const match = teachers.find(
      t => t.name.toLowerCase() === searchTerm.trim().toLowerCase()
    );
    if (match) {
      setSelectedTeacher(match);
      setSearchTerm('');
      setSearchActive(false);
    }
  };

  const handleTeacherClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setSearchTerm('');
    setSearchActive(false);
  };

  // Gestione click su "Vai alle sostituzioni giornaliere"
  const handleGoToDailySubs = () => {
    navigate(`/sostituzioni-giornaliere?date=${formatLocalDate(date)}`);
  };

  const formattedDate = formatLocalDate(date);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gestione Sostituzioni</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md flex-1">
          <h2 className="text-xl font-semibold mb-4">Orario Docenti</h2>

          {/* FORM DI RICERCA DOCENTE */}
          <form
            className="mb-3 relative"
            onSubmit={handleSearchSubmit}
            autoComplete="off"
          >
            <label htmlFor="teacherSearch" className="block text-gray-700 mb-1">
              Ricerca Docente:
            </label>
            <div className="relative">
              <input
                id="teacherSearch"
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setSearchActive(true)}
                className="w-full md:w-80 p-2 border border-gray-300 rounded pl-9 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Cerca per nome docente e premi invio"
                autoComplete="off"
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            {/* Lista dropdown dei docenti filtrati */}
            {searchTerm && searchActive && filteredTeachers.length > 0 && (
              <ul className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-white border border-gray-200 rounded shadow-lg z-50">
                {filteredTeachers.map(teacher => (
                  <li
                    key={teacher.id}
                    onClick={() => handleTeacherClick(teacher)}
                    className="cursor-pointer px-4 py-2 hover:bg-blue-100"
                  >
                    {teacher.name}
                  </li>
                ))}
              </ul>
            )}
          </form>
              
          <div className="mb-6">
            <label htmlFor="teacherSelect" className="block text-gray-700 mb-2">
              Seleziona Docente:
            </label>
            <select
              id="teacherSelect"
              value={selectedTeacher?.id || ''}
              onChange={handleTeacherChange}
              className="w-full md:w-80 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Seleziona un docente --</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTeacher && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-3">Orario settimanale di {selectedTeacher.name}</h3>
              <ScheduleTable 
                key={selectedTeacher.id} 
                teacher={selectedTeacher} 
                selectedDate={formattedDate}
              />
            </div>
          )}
        </div>

        {/* Calendario e navigazione alle sostituzioni giornaliere */}
        <div className="bg-white p-6 rounded-lg shadow-md flex-shrink-0 w-full md:w-80">
          <h2 className="text-xl font-semibold mb-4">Gestione Sostituzioni Giorno</h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal mb-3"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Seleziona data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <Button
            onClick={handleGoToDailySubs}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Vai alle sostituzioni giornaliere
          </Button>
        </div>
      </div>
    </div>
  );
};
