
import { Teacher } from '../types';
import { useData } from '../contexts/DataContext';
import { Button } from './ui/button';
import { Printer, Table, Trash2 } from 'lucide-react';

interface PermissionsListProps {
  teacher?: Teacher;
}

export const PermissionsList = ({ teacher }: PermissionsListProps) => {
  const { teachers, updatePermission, deletePermission } = useData();

  // Se non viene fornito un docente specifico, mostra i permessi di tutti i docenti
  const teachersToShow = teacher ? [teacher] : teachers;

  // === ORDINA I PERMESSI IN ORDINE CRONOLOGICO (dal meno recente al più recente) ===
  function getSortedPermissions(t: Teacher) {
    return [...t.permissions].sort((a, b) => {
      try {
        // Create date objects for safe comparison
        const datePartsA = a.date.split('-');
        const datePartsB = b.date.split('-');
        
        // Only create dates if the format is valid (YYYY-MM-DD)
        if (datePartsA.length === 3 && datePartsB.length === 3) {
          // Create date objects using YYYY, MM-1 (months are 0-indexed), DD
          const dateA = new Date(
            parseInt(datePartsA[0]), 
            parseInt(datePartsA[1])-1, 
            parseInt(datePartsA[2])
          );
          
          const dateB = new Date(
            parseInt(datePartsB[0]), 
            parseInt(datePartsB[1])-1, 
            parseInt(datePartsB[2])
          );
          
          // Verify both dates are valid before comparing
          if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
            // Sort from oldest to newest
            return dateA.getTime() - dateB.getTime();
          }
        }
        
        // Fallback to string comparison if date creation fails
        return a.date.localeCompare(b.date);
      } catch (error) {
        console.error("Error sorting dates:", error);
        return 0; // Keep original order if there's an error
      }
    });
  }

  const handleRecoveryUpdate = (teacherId: string, permissionId: string, recoveryDate: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;
    
    const permission = teacher.permissions.find(p => p.id === permissionId);
    if (!permission) return;
    
    updatePermission(teacherId, {
      ...permission,
      recovered: true,
      recoveryDate
    });
  };

  const handleDeletePermission = (teacherId: string, permissionId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo permesso?')) {
      deletePermission(teacherId, permissionId);
    }
  };

  if (teachersToShow.length === 0 || teachersToShow.every(t => t.permissions.length === 0)) {
    return <p className="text-gray-500 italic">Nessun permesso registrato.</p>;
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-3">Permessi registrati</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3 border">Docente</th>
              <th className="py-2 px-3 border">Data</th>
              <th className="py-2 px-3 border">Ore</th>
              <th className="py-2 px-3 border">Stato</th>
              <th className="py-2 px-3 border">Data recupero</th>
              <th className="py-2 px-3 border">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {teachersToShow.flatMap(teacher => 
              getSortedPermissions(teacher).map(permission => (
                <tr key={permission.id} className={permission.recovered ? 'bg-green-50' : ''}>
                  <td className="py-2 px-3 border">{teacher.name}</td>
                  <td className="py-2 px-3 border">{permission.date}</td>
                  <td className="py-2 px-3 border text-center">{permission.hours}</td>
                  <td className="py-2 px-3 border text-center">
                    {permission.recovered ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Recuperato
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        Da recuperare
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 border text-center">
                    {permission.recoveryDate || '-'}
                  </td>
                  <td className="py-2 px-3 border text-center">
                    {!permission.recovered ? (
                      <Button
                        onClick={() => {
                          const date = prompt('Inserisci la data di recupero (YYYY-MM-DD):', 
                            new Date().toISOString().split('T')[0]);
                          if (date) {
                            handleRecoveryUpdate(teacher.id, permission.id, date);
                          }
                        }}
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white mr-2"
                      >
                        Segna come recuperato
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleDeletePermission(teacher.id, permission.id)}
                        variant="destructive"
                        size="sm"
                        className="mr-2"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Elimina
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
