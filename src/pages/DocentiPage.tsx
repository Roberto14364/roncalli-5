
import { useState, FormEvent, ChangeEvent } from 'react';
import { useData } from '../contexts/DataContext';
import { ScheduleTable } from '../components/ScheduleTable';
import { Teacher, Schedule } from '../types';
import { exportToJson, importFromJson, importTeachersFromExcel, importTeachersFromPdf, createEmptySchedule, generateId } from '../utils/helpers';
import { Search } from "lucide-react";

export const DocentiPage = () => {
  const { teachers, setTeachers, addTeacher, updateTeacher, deleteTeacher, clearAllData, exportData, importData } = useData();
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');

  // Stato per il nuovo form di ricerca
  const [searchInput, setSearchInput] = useState('');
  const [dropdownActive, setDropdownActive] = useState(false);

  // Docenti filtrati per il nuovo form
  const filteredSearchTeachers = searchInput.trim()
    ? teachers.filter(teacher =>
        teacher.name.toLowerCase().includes(searchInput.trim().toLowerCase())
      )
    : [];

  // Ricerca originale per "Cerca Docente"
  // (RIMOSSO filtro e stato relativo a "Cerca Docente")

  const handleScheduleChange = (schedule: Schedule) => {
    if (selectedTeacher) {
      const updatedTeacher = {
        ...selectedTeacher,
        schedule
      };
      updateTeacher(updatedTeacher);
    }
  };

  const handleAddTeacher = () => {
    if (!newTeacherName.trim()) {
      alert('Inserisci il nome del docente');
      return;
    }

    const newTeacher: Teacher = {
      id: generateId(),
      name: newTeacherName.trim(),
      schedule: createEmptySchedule(),
      permissions: []
    };

    addTeacher(newTeacher);
    setNewTeacherName('');
    setSelectedTeacher(newTeacher);
  };

  const handleDeleteTeacher = () => {
    if (!selectedTeacher) return;
    if (window.confirm(`Sei sicuro di voler eliminare il docente "${selectedTeacher.name}"?`)) {
      deleteTeacher(selectedTeacher.id);
      setSelectedTeacher(null);
    }
  };

  const handleExportData = () => {
    const dataToExport = exportData();
    exportToJson(JSON.parse(dataToExport));
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importFromJson(file)
      .then(data => {
        const success = importData(JSON.stringify(data));
        if (success) {
          alert('Dati importati con successo!');
        } else {
          alert('Errore durante l\'importazione dei dati.');
        }
      })
      .catch(error => {
        console.error('Errore durante l\'importazione:', error);
        alert(`Errore durante l'importazione: ${error.message}`);
      });

    e.target.value = '';
  };

  const handleImportPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedTeachers = await importTeachersFromPdf(file);
      const existingByName = new Map<string, Teacher>(teachers.map(teacher => [teacher.name.trim().toLocaleLowerCase('it'), teacher] as const));
      const mergedTeachers = importedTeachers.map(teacher => {
        const existing = existingByName.get(teacher.name.trim().toLocaleLowerCase('it'));
        return {
          ...teacher,
          id: existing?.id ?? teacher.id,
          permissions: existing?.permissions ?? teacher.permissions ?? [],
        };
      });
      setTeachers(mergedTeachers);
      alert(`Orario importato con successo: ${mergedTeachers.length} docenti caricati.`);
    } catch (error) {
      console.error('Errore durante l’importazione del PDF:', error);
      alert(`Errore durante l’importazione del PDF: ${error instanceof Error ? error.message : 'file non leggibile'}`);
    }

    e.target.value = '';
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importTeachersFromExcel(file)
      .then(importedTeachers => {
        if (importedTeachers.length > 0) {
          // Aggiorna i docenti già presenti invece di creare duplicati e conserva
          // ID e permessi associati ai docenti esistenti.
          const existingByName = new Map<string, Teacher>(
            teachers.map(teacher => [teacher.name.trim().toLocaleLowerCase('it'), teacher] as const)
          );
          const mergedTeachers = importedTeachers.map(teacher => {
            const existing = existingByName.get(teacher.name.trim().toLocaleLowerCase('it'));
            return {
              ...teacher,
              id: existing?.id ?? teacher.id,
              permissions: existing?.permissions ?? teacher.permissions ?? [],
            };
          });
          setTeachers(mergedTeachers);
          setSelectedTeacher(null);
          alert(`Orario Excel importato con successo: ${mergedTeachers.length} docenti caricati.`);
        } else {
          alert('Nessun docente trovato nel file Excel.');
        }
      })
      .catch(error => {
        console.error('Errore durante l\'importazione da Excel:', error);
        alert(`Errore durante l'importazione da Excel: ${error.message}`);
      });

    e.target.value = '';
  };

  // === NUOVO FORM DI RICERCA DOCENTE ===
  const handleSearchInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setDropdownActive(true);
  };

  // Gestione invio del nuovo form di ricerca docente
  const handleTeacherSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const match = teachers.find(
      t => t.name.toLowerCase() === searchInput.trim().toLowerCase()
    );
    if (match) {
      setSelectedTeacher(match);
      setSearchInput('');
      setDropdownActive(false);
    }
  };

  // Click su un elemento filtrato nel dropdown di ricerca
  const handleTeacherDropdownSelect = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setSearchInput('');
    setDropdownActive(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gestione Docenti</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ricerca e modifica docenti */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Cerca e Modifica Docenti</h2>
          
          {/* === NUOVO FORM DI RICERCA DOCENTE === */}
          <form 
            className="mb-4 relative"
            onSubmit={handleTeacherSearchSubmit}
            autoComplete="off"
          >
            <label htmlFor="searchTeacherDirect" className="block text-gray-700 mb-2">
              Ricerca Docente Rapida:
            </label>
            <div className="relative">
              <input
                type="text"
                id="searchTeacherDirect"
                value={searchInput}
                onChange={handleSearchInputChange}
                onFocus={() => setDropdownActive(true)}
                className="w-full p-2 border border-gray-300 rounded pl-9 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Cerca per nome docente e premi invio"
                autoComplete="off"
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            {/* Lista dropdown dei docenti filtrati */}
            {searchInput && dropdownActive && filteredSearchTeachers.length > 0 && (
              <ul className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-white border border-gray-200 rounded shadow-lg z-50">
                {filteredSearchTeachers.map(teacher => (
                  <li
                    key={teacher.id}
                    onClick={() => handleTeacherDropdownSelect(teacher)}
                    className="cursor-pointer px-4 py-2 hover:bg-blue-100"
                  >
                    {teacher.name}
                  </li>
                ))}
              </ul>
            )}
          </form>
          
          {/* === FORM DI RICERCA ORIGINALE: RIMOSSO === */}

          {/* LA SELECT A DISCESA PUÒ RESTARE MA NON VIENE USATA PIÙ */}
          {/* La seguente sezione (select a discesa) può essere lasciata, ma non ha più impatto sulla UX desiderata. */}
          {/* Se vuoi puoi chiedere di rimuoverla totalmente in un secondo momento! */}
          {/* --- BEGIN SELECT DOCENTE (PUÒ RESTARE) --- */}
          {/* 
          {filteredTeachers.length > 0 ? (
            <div className="mb-6">
              <label htmlFor="selectTeacher" className="block text-gray-700 mb-2">
                Seleziona Docente:
              </label>
              <select
                id="selectTeacher"
                value={selectedTeacher?.id || ''}
                onChange={(e) => {
                  const teacherId = e.target.value;
                  const teacher = teachers.find(t => t.id === teacherId) || null;
                  setSelectedTeacher(teacher);
                }}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Seleziona un docente --</option>
                {filteredTeachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-gray-500 italic mb-6">Nessun docente trovato con questo nome.</p>
          )}
          */}
          {/* --- END SELECT DOCENTE (PUÒ RESTARE) --- */}

          {selectedTeacher && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-3">Modifica orario di {selectedTeacher.name}</h3>
              <p className="text-sm text-gray-600 mb-3">
                Compila le celle con il nome della classe o "DIS" per le ore a disposizione.
              </p>
              <ScheduleTable 
                teacher={selectedTeacher} 
                editable={true} 
                onScheduleChange={handleScheduleChange}
              />
              <button
                onClick={handleDeleteTeacher}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Elimina docente
              </button>
            </div>
          )}
        </div>

        {/* Aggiungi nuovo docente */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Aggiungi Nuovo Docente</h2>
          
          <div className="mb-6">
            <label htmlFor="newTeacherName" className="block text-gray-700 mb-2">
              Nome del Docente:
            </label>
            <div className="flex">
              <input
                type="text"
                id="newTeacherName"
                value={newTeacherName}
                onChange={(e) => setNewTeacherName(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Inserisci il nome del nuovo docente"
              />
              <button
                onClick={handleAddTeacher}
                className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Aggiungi
              </button>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4 mt-8">Gestione Dati</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleExportData}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Esporta Dati (JSON)
            </button>
            
            <div className="relative">
              <button
                onClick={() => document.getElementById('importJson')?.click()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Importa Dati (JSON)
              </button>
              <input
                type="file"
                id="importJson"
                accept=".json"
                className="hidden"
                onChange={handleImportData}
              />
            </div>
            
            <div className="relative">
              <button
                onClick={() => document.getElementById('importPdf')?.click()}
                className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Importa Orario (PDF)
              </button>
              <input
                type="file"
                id="importPdf"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleImportPdf}
              />
            </div>

            <div className="relative">
              <button
                onClick={() => document.getElementById('importExcel')?.click()}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Importa Docenti (Excel)
              </button>
              <input
                type="file"
                id="importExcel"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleImportExcel}
              />
            </div>
            
            <button
              onClick={clearAllData}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Elimina Tutti i Dati
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// NOTA: Questo file inizia a diventare troppo lungo. Valuta una futura richiesta di refactoring!
