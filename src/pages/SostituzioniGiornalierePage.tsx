
import { useRef, useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Printer, Trash2 } from 'lucide-react';
import { formatLocalDate, getTimeRange, SPECIAL_REPLACEMENT_OPTIONS } from '../utils/scheduleUtils';
import { useToast } from '../hooks/use-toast';

// Funzione per leggere la data dalla query string
function getQueryDate(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('date');
}

export const SostituzioniGiornalierePage = () => {
  const { teachers, replacements, deleteReplacement } = useData();
  const [selectedDate, setSelectedDate] = useState<string>(formatLocalDate(new Date()));
  const tableRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Imposta la data dalla query se esiste
  useEffect(() => {
    const qDate = getQueryDate();
    if (qDate) {
      setSelectedDate(qDate);
    }
  }, []);

  const dailyReplacements = replacements.filter(r => r.date === selectedDate);

  const getTeacherName = (id: string) => {
    const teacher = teachers.find(t => t.id === id);
    return teacher ? teacher.name : 'Docente non trovato';
  };

  // Funzione per formattare la visualizzazione della classe
  const formatClassName = (replacement: any) => {
    // Per tutte le sostituzioni, prima cerchiamo la classe originale
    const absentTeacher = teachers.find(t => t.id === replacement.absentTeacherId);
    if (absentTeacher) {
      // Ottieni il giorno della settimana dalla data
      const date = new Date(replacement.date);
      const dayNames = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
      const day = dayNames[date.getDay()];
      
      // Cerca la classe originale nell'orario del docente assente
      const originalClass = absentTeacher.schedule[day]?.[replacement.hour];
      
      if (originalClass) {
        return originalClass;
      }
    }
    
    // Se non troviamo una classe originale e il valore è un'opzione speciale,
    // restituiamo un valore generico
    if (SPECIAL_REPLACEMENT_OPTIONS.includes(replacement.className)) {
      return " "; // Oppure "Non specificata" se preferisci mostrare un testo
    }
    
    // Fallback: mostra quello che c'è nel campo className se non è un'opzione speciale
    return replacement.className;
  };

  // Funzione per visualizzare il nome del docente sostituto con l'indicazione del recupero permesso
  const formatReplacementTeacherDisplay = (replacement: any) => {
    // Se non c'è un docente sostituto, mostra il valore di className
    if (!replacement.replacementTeacherId) {
      return replacement.className;
    }
    
    const teacherName = getTeacherName(replacement.replacementTeacherId);
    
    // Controlla esplicitamente se è un recupero permesso
    if (replacement.className === "Recupero permesso") {
      return `${teacherName} (Per. Rec.)`;
    }
    
    return teacherName;
  };

  const handlePrint = () => {
    if (tableRef.current) {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Il blocco popup è attivo. Abilita i popup per utilizzare questa funzione.');
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Sostituzioni del ${selectedDate}</title>
            <style>
              body { font-family: Arial, sans-serif; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              h1 { text-align: center; }
            </style>
          </head>
          <body>
            <h1>Sostituzioni del ${selectedDate}</h1>
            ${tableRef.current.outerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleDeleteReplacement = (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa sostituzione?')) {
      deleteReplacement(id);
      toast({
        title: "Sostituzione eliminata",
        description: "La sostituzione è stata eliminata con successo.",
      });
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Sostituzioni Giornaliere</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="mb-4 md:mb-0">
            <label htmlFor="date" className="block text-gray-700 mb-2">
              Seleziona Data:
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Stampa
            </Button>
          </div>
        </div>

        <div ref={tableRef}>
          <Table>
            <TableCaption>Sostituzioni per il giorno {selectedDate}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Ora</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Docente Assente</TableHead>
                <TableHead>Docente Sostituto</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyReplacements.length > 0 ? (
                dailyReplacements.map((replacement) => (
                  <TableRow key={replacement.id}>
                    <TableCell>{getTimeRange(replacement.hour)}</TableCell>
                    <TableCell>{formatClassName(replacement)}</TableCell>
                    <TableCell>{getTeacherName(replacement.absentTeacherId)}</TableCell>
                    <TableCell>
                      {formatReplacementTeacherDisplay(replacement)}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteReplacement(replacement.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    Nessuna sostituzione registrata per questa data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
