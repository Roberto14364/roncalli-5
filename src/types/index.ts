
// Definizioni dei tipi per l'applicazione

export type User = {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'collaborator';
};

export type Teacher = {
  id: string;
  name: string;
  schedule: Schedule;
  permissions: Permission[];
};

export type Schedule = {
  [day: string]: {
    [hour: string]: string; // Contiene l'informazione della classe
  };
};

export type Permission = {
  id: string;
  date: string;
  hours: number;
  recovered: boolean;
  recoveryDate?: string;
};

export type Day = 'lunedì' | 'martedì' | 'mercoledì' | 'giovedì' | 'venerdì' | 'sabato';

export type Hour = '8:30' | '9:30' | '10:30' | '11:30' | '12:30' | '13:30' | '14:30';

export type Replacement = {
  id: string;
  date: string;
  hour: Hour;
  absentTeacherId: string;
  replacementTeacherId: string;
  className: string;
};
