
import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Permission, Teacher } from '../types';
import { PermissionsList } from '../components/PermissionsList';
import { generateId } from '../utils/helpers';
import { Input } from "../components/ui/input";
import { Search } from "lucide-react";

export const PermessiPage = () => {
  const { teachers, addPermission } = useData();
  const [searchValue, setSearchValue] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | undefined>(undefined);

  // Per il form di registrazione permesso
  const [date, setDate] = useState('');
  const [hours, setHours] = useState(1);

  // Aggiorna il docente selezionato al variare della ricerca
  const filteredTeachers = useMemo(() => {
    if (!searchValue) return [];
    return teachers.filter(t =>
      t.name.toLowerCase().includes(searchValue.trim().toLowerCase())
    );
  }, [teachers, searchValue]);

  // Se l'utente seleziona un docente dalla lista risultati: si imposta come selectedTeacher
  const handleTeacherClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setSearchValue(teacher.name);
  };

  // Se si cambia testo, resettiamo il docente selezionato
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setSelectedTeacher(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Serve docente selezionato
    if (!selectedTeacher || !date || hours <= 0) {
      alert('Compila tutti i campi correttamente e seleziona un docente valido.');
      return;
    }

    const newPermission: Permission = {
      id: generateId(),
      date,
      hours,
      recovered: false
    };

    addPermission(selectedTeacher.id, newPermission);

    // Reset form
    setSearchValue('');
    setSelectedTeacher(undefined);
    setDate('');
    setHours(1);

    alert('Permesso registrato con successo!');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gestione Permessi Docenti</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Registra Nuovo Permesso</h2>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="relative">
              <label htmlFor="searchTeacher" className="block text-gray-700 mb-2">
                Cerca docente <span className="text-gray-400">(digita il nome)</span>:
              </label>
              <div className="relative">
                <Input
                  id="searchTeacher"
                  type="text"
                  placeholder="Cerca per nome docente"
                  value={searchValue}
                  onChange={handleInputChange}
                  autoComplete="off"
                  className="w-full pr-10"
                />
                <Search className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>

              {/* Mostra lista suggerimenti solo se non è già stato selezionato un docente */}
              {searchValue && !selectedTeacher && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-40 overflow-y-auto">
                  {filteredTeachers.length === 0 && (
                    <div className="p-2 text-gray-500 text-sm">Nessun docente trovato</div>
                  )}
                  {filteredTeachers.map(teacher => (
                    <div
                      key={teacher.id}
                      className="cursor-pointer px-3 py-2 hover:bg-gray-100 text-sm"
                      onClick={() => handleTeacherClick(teacher)}
                    >
                      {teacher.name}
                    </div>
                  ))}
                </div>
              )}

              {/* Badge se docente selezionato */}
              {selectedTeacher && (
                <div className="mt-1 text-green-700 text-sm font-semibold">
                  Docente selezionato: {selectedTeacher.name}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="date" className="block text-gray-700 mb-2">
                Data:
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="hours" className="block text-gray-700 mb-2">
                Numero di Ore:
              </label>
              <input
                type="number"
                id="hours"
                min="1"
                max="8"
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Registra Permesso
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Elenco Permessi</h2>
        {/* La lista mostra solo i permessi del docente selezionato se presente, altrimenti mostra tutti */}
        <PermissionsList teacher={selectedTeacher} />
      </div>
    </div>
  );
};
