
import { createContext, useContext, ReactNode } from 'react';
import { Teacher, Permission, Replacement } from '../types';
import { useTeachers } from '../hooks/useTeachers';
import { useReplacements } from '../hooks/useReplacements';
import { useDataManagement } from '../hooks/useDataManagement';

interface DataContextType {
  teachers: Teacher[];
  setTeachers: (teachers: Teacher[]) => void;
  addTeacher: (teacher: Teacher) => void;
  updateTeacher: (teacher: Teacher) => void;
  deleteTeacher: (id: string) => void;
  addPermission: (teacherId: string, permission: Permission) => void;
  updatePermission: (teacherId: string, permission: Permission) => void;
  deletePermission: (teacherId: string, permissionId: string) => void;
  clearAllData: () => void;
  exportData: () => string;
  importData: (data: string) => boolean;
  replacements: Replacement[];
  addReplacement: (replacement: Replacement) => void;
  deleteReplacement: (id: string) => void;
  getReplacementsByDate: (date: string) => Replacement[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const {
    teachers,
    setTeachers,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    addPermission,
    updatePermission,
    deletePermission
  } = useTeachers();

  const {
    replacements,
    setReplacements,
    addReplacement,
    deleteReplacement,
    getReplacementsByDate
  } = useReplacements();

  const {
    clearAllData,
    exportData: exportDataFn,
    importData: importDataFn
  } = useDataManagement(setTeachers, setReplacements);

  const exportData = () => exportDataFn(teachers, replacements);
  const importData = (data: string) => importDataFn(data);

  return (
    <DataContext.Provider
      value={{
        teachers,
        setTeachers,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addPermission,
        updatePermission,
        deletePermission,
        clearAllData,
        exportData,
        importData,
        replacements,
        addReplacement,
        deleteReplacement,
        getReplacementsByDate
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
