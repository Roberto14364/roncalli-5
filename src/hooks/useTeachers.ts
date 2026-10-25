
import { useState, useCallback } from 'react';
import { Teacher, Permission } from '../types';
import { mockTeachers } from '../data/mock-data';
import { useLocalStorage } from './useLocalStorage';

export function useTeachers() {
  const [teachers, setTeachers] = useLocalStorage<Teacher[]>('teachers', mockTeachers);

  const addTeacher = useCallback((teacher: Teacher) => {
    setTeachers([...teachers, teacher]);
  }, [teachers, setTeachers]);

  const updateTeacher = useCallback((teacher: Teacher) => {
    setTeachers(teachers.map(t => t.id === teacher.id ? teacher : t));
  }, [teachers, setTeachers]);

  const deleteTeacher = useCallback((id: string) => {
    setTeachers(teachers.filter(t => t.id !== id));
  }, [teachers, setTeachers]);

  const addPermission = useCallback((teacherId: string, permission: Permission) => {
    setTeachers(teachers.map(teacher => {
      if (teacher.id === teacherId) {
        return {
          ...teacher,
          permissions: [...teacher.permissions, permission]
        };
      }
      return teacher;
    }));
  }, [teachers, setTeachers]);

  const updatePermission = useCallback((teacherId: string, permission: Permission) => {
    setTeachers(teachers.map(teacher => {
      if (teacher.id === teacherId) {
        return {
          ...teacher,
          permissions: teacher.permissions.map(p => 
            p.id === permission.id ? permission : p
          )
        };
      }
      return teacher;
    }));
  }, [teachers, setTeachers]);

  const deletePermission = useCallback((teacherId: string, permissionId: string) => {
    setTeachers(teachers.map(teacher => {
      if (teacher.id === teacherId) {
        return {
          ...teacher,
          permissions: teacher.permissions.filter(p => p.id !== permissionId)
        };
      }
      return teacher;
    }));
  }, [teachers, setTeachers]);

  return {
    teachers,
    setTeachers,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    addPermission,
    updatePermission,
    deletePermission
  };
}
