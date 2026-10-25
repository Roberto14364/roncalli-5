import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Teacher } from '../types';
import { formatLocalDate, SPECIAL_REPLACEMENT_OPTIONS } from '../utils/scheduleUtils';
import { generateId } from '../utils/helpers';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useToast } from '../hooks/use-toast';

type ReplacementModalProps = {
  isOpen: boolean;
  onClose: () => void;
  day: string;
  hour: string;
  className: string;
  teacher: Teacher;
  selectedDate?: string;
};

type Choice = { value: string; label: string; kind: 'special' | 'permission' | 'disp' | 'compresenza'; teacher?: Teacher };

export const ReplacementModal: React.FC<ReplacementModalProps> = ({
  isOpen, onClose, day, hour, className, teacher, selectedDate
}) => {
  const { teachers, replacements, addReplacement, updatePermission } = useData();
  const effectiveDate = selectedDate || formatLocalDate(new Date());
  const [selectedOption, setSelectedOption] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) setSelectedOption('');
  }, [isOpen, day, hour, teacher.id]);

  // Le opzioni speciali sono sempre disponibili, qualunque sia il contenuto della cella.
  // I docenti DISP devono avere DISP proprio nella stessa fascia oraria; chi recupera
  // un permesso deve invece avere la cella vuota in quella fascia.
  const choices = useMemo<Choice[]>(() => {
    const special: Choice[] = SPECIAL_REPLACEMENT_OPTIONS.map((label, i) => ({
      value: `special:${i}`, label, kind: 'special'
    }));

    const normalizedCell = (value: unknown) => String(value ?? '').trim().toLocaleUpperCase('it');
    // Nel tabellone ufficiale alcune classi hanno il suffisso didattico L/T
    // (es. "2E L", "5C T") e alcune celle contengono più classi separate da "-".
    // Per le variazioni confrontiamo i codici classe, non il suffisso.
    const classCodes = (value: unknown): string[] => normalizedCell(value)
      .split(/\s*-\s*/)
      .map(part => part.trim().replace(/\s+[LT]$/, '').trim())
      .filter(Boolean);
    const sameClass = (a: unknown, b: unknown) => {
      const aCodes = classCodes(a);
      const bCodes = classCodes(b);
      return aCodes.some(code => bCodes.includes(code));
    };
    const currentCell = normalizedCell(className);
    const orderedHours = ['8:30', '9:30', '10:30', '11:30', '12:30', '13:30'];
    const currentHourIndex = orderedHours.indexOf(hour);
    const isClassCell = currentCell !== '' && currentCell !== 'DISP' && currentCell !== 'DIS';

    // Un docente già assegnato a una supplenza nella stessa data e fascia oraria
    // non è più disponibile. Anche le variazioni d'orario impegnano il docente
    // indicato nell'etichetta, pur non avendo replacementTeacherId.
    const sameDateHourReplacements = replacements.filter(
      r => r.date === effectiveDate && String(r.hour) === String(hour)
    );
    const busyTeacherIds = new Set<string>(
      sameDateHourReplacements
        .filter(r => r.replacementTeacherId)
        .map(r => r.replacementTeacherId)
    );
    sameDateHourReplacements.forEach(r => {
      const match = String(r.className || '').match(/docente:\s*(.+)$/i);
      if (match) {
        const assignedName = match[1].trim().toLocaleLowerCase('it');
        const assignedTeacher = teachers.find(t => t.name.trim().toLocaleLowerCase('it') === assignedName);
        if (assignedTeacher) busyTeacherIds.add(assignedTeacher.id);
      }
    });
    const isAvailable = (t: Teacher) => t.id !== teacher.id && !busyTeacherIds.has(t.id);
    const isFreeAt = (t: Teacher, targetHour: string) => {
      const cell = normalizedCell(t.schedule?.[day]?.[targetHour]);
      if (!(cell === '' || cell === 'DISP' || cell === 'DIS')) return false;
      return !replacements.some(r => {
        if (r.date !== effectiveDate || String(r.hour) !== targetHour) return false;
        if (r.replacementTeacherId === t.id) return true;
        // Le variazioni d'orario registrano il nome nel testo della scelta.
        const match = String(r.className || '').match(/docente:\s*(.+)$/i);
        return !!match && match[1].trim().toLocaleLowerCase('it') === t.name.trim().toLocaleLowerCase('it');
      });
    };

    // Variazioni d'orario: il docente deve essere libero nell'ora dell'assenza.
    // Per posticipare la prima ora, deve anche essere libero alla seconda ora:
    // altrimenti si sovrapporrebbe a una lezione in un'altra classe.
    if (isClassCell && currentHourIndex > 0) {
      const firstHourTeacher = teachers.find(t =>
        isAvailable(t) &&
        sameClass(t.schedule?.[day]?.['8:30'], currentCell) &&
        isFreeAt(t, hour) &&
        isFreeAt(t, '9:30')
      );
      if (firstHourTeacher) {
        special.push({
          value: `schedule-change:late-entry:${firstHourTeacher.id}`,
          label: `Variazione orario: entra alle 9:30 (lezione della prima ora posticipata) — docente: ${firstHourTeacher.name}`,
          kind: 'special',
        });
      }

      // Ogni docente che ha lezione nella stessa classe in un'ora successiva
      // può anticiparla all'ora dell'assenza solo se è realmente libero in quella
      // fascia. Questo include quinta e sesta ora, non soltanto l'ultima.
      orderedHours.slice(currentHourIndex + 1).forEach(sourceHour => {
        teachers.forEach(candidate => {
          if (!isAvailable(candidate)) return;
          if (!sameClass(candidate.schedule?.[day]?.[sourceHour], currentCell)) return;
          if (!isFreeAt(candidate, hour)) return;
          special.push({
            value: `schedule-change:advance:${sourceHour}:${candidate.id}`,
            label: `Variazione orario: lezione delle ${sourceHour} anticipata alle ${hour}${sourceHour === orderedHours[orderedHours.length - 1] ? ' (uscita anticipata)' : ''} — docente: ${candidate.name}`,
            kind: 'special',
          });
        });
      });
    }

    const disp: Choice[] = teachers
      .filter(t => {
        if (!isAvailable(t)) return false;
        const value = normalizedCell(t.schedule?.[day]?.[hour]);
        return value === 'DISP' || value === 'DIS';
      })
      .map(t => ({ value: `disp:${t.id}`, label: `${t.name} (DISP)`, kind: 'disp' }));

    // Docenti che condividono la stessa classe nella stessa fascia oraria.
    // Non mostrare compresenze quando la cella è vuota o contiene DISP/DIS.
    const compresenza: Choice[] = currentCell && currentCell !== 'DISP' && currentCell !== 'DIS'
      ? teachers
          .filter(t => isAvailable(t) && normalizedCell(t.schedule?.[day]?.[hour]) === currentCell)
          .map(t => ({ value: `compresenza:${t.id}`, label: `${t.name} (${className.trim()})`, kind: 'compresenza' }))
      : [];

    const permission: Choice[] = teachers
      .filter(t => {
        if (!isAvailable(t)) return false;
        const cell = (t.schedule?.[day]?.[hour] ?? '').trim();
        return cell === '' && !!t.permissions?.some(p => !p.recovered);
      })
      .filter(t => !disp.some(d => d.value === `disp:${t.id}`))
      .map(t => ({ value: `permission:${t.id}`, label: `${t.name} (recupero permesso)`, kind: 'permission' }));

    return [...special, ...disp, ...compresenza, ...permission];
  }, [teachers, replacements, teacher.id, day, hour, className, effectiveDate]);

  const handleConfirm = () => {
    const choice = choices.find(item => item.value === selectedOption);
    if (!choice) return;
    const replacementDate = effectiveDate;

    if (choice.kind === 'special') {
      const specialOption = choice.label;
      addReplacement({
        id: generateId(), date: replacementDate, hour: hour as any,
        absentTeacherId: teacher.id, replacementTeacherId: null as any,
        className: specialOption,
      });
      toast({ title: 'Sostituzione registrata', description: `${specialOption} il ${replacementDate}.` });
    } else if (choice.teacher || choice.value.startsWith('disp:') || choice.value.startsWith('permission:') || choice.value.startsWith('compresenza:')) {
      const teacherId = choice.value.split(':')[1];
      const replacementTeacher = teachers.find(t => t.id === teacherId);
      if (!replacementTeacher) return;

      const isPermission = choice.kind === 'permission';
      addReplacement({
        id: generateId(), date: replacementDate, hour: hour as any,
        absentTeacherId: teacher.id, replacementTeacherId: replacementTeacher.id,
        className: isPermission ? 'Recupero permesso' : (className || 'Sostituzione'),
      });

      if (isPermission) {
        const permission = replacementTeacher.permissions?.find(p => !p.recovered);
        if (permission) {
          updatePermission(replacementTeacher.id, {
            ...permission, recovered: true, recoveryDate: formatLocalDate(new Date()),
          });
        }
        toast({ title: 'Sostituzione registrata', description: `${replacementTeacher.name} recupererà un permesso nell'ora ${hour} il ${replacementDate}.` });
      } else if (choice.kind === 'compresenza') {
        toast({ title: 'Compresenza selezionata', description: `${replacementTeacher.name} ha la stessa classe (${className}) nella fascia ${hour}.` });
      } else {
        toast({ title: 'Sostituzione registrata', description: `${replacementTeacher.name} è stato selezionato per la fascia ${hour} il ${replacementDate}.` });
      }
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md w-full p-4" aria-describedby="modal-description">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">Opzioni sostituzione</DialogTitle>
        </DialogHeader>
        <ScrollArea id="modal-description" className="h-[400px] pr-2 py-2">
          <div className="space-y-4">
            <section>
              <h3 className="font-medium text-sm mb-2">ORARIO / ALTRE OPZIONI</h3>
              <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                {choices.filter(c => c.kind === 'special').map(c => (
                  <div key={c.value} className="flex items-start text-sm py-1">
                    <RadioGroupItem id={c.value} value={c.value} className="mr-2 mt-1" />
                    <label htmlFor={c.value} className="text-sm cursor-pointer">{c.label}</label>
                  </div>
                ))}
              </RadioGroup>
            </section>
            <section>
              <h3 className="font-medium text-sm mb-2">DOCENTI DISP NELLA STESSA FASCIA</h3>
              {choices.filter(c => c.kind === 'disp').length ? (
                <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                  {choices.filter(c => c.kind === 'disp').map(c => (
                    <div key={c.value} className="flex items-start text-sm py-1">
                      <RadioGroupItem id={c.value} value={c.value} className="mr-2 mt-1" />
                      <label htmlFor={c.value} className="text-sm cursor-pointer">{c.label}</label>
                    </div>
                  ))}
                </RadioGroup>
              ) : <p className="text-sm text-gray-500">Nessun docente con DISP in questa fascia.</p>}
            </section>
            <section>
              <h3 className="font-medium text-sm mb-2">DOCENTI IN COMPRESENZA NELLA STESSA FASCIA</h3>
              {choices.filter(c => c.kind === 'compresenza').length ? (
                <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                  {choices.filter(c => c.kind === 'compresenza').map(c => (
                    <div key={c.value} className="flex items-start text-sm py-1">
                      <RadioGroupItem id={c.value} value={c.value} className="mr-2 mt-1" />
                      <label htmlFor={c.value} className="text-sm cursor-pointer">{c.label}</label>
                    </div>
                  ))}
                </RadioGroup>
              ) : <p className="text-sm text-gray-500">Nessun docente in compresenza in questa fascia.</p>}
            </section>
            <section>
              <h3 className="font-medium text-sm mb-2">DOCENTI CON PERMESSI DA RECUPERARE</h3>
              {choices.filter(c => c.kind === 'permission').length ? (
                <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                  {choices.filter(c => c.kind === 'permission').map(c => (
                    <div key={c.value} className="flex items-start text-sm py-1">
                      <RadioGroupItem id={c.value} value={c.value} className="mr-2 mt-1" />
                      <label htmlFor={c.value} className="text-sm cursor-pointer">{c.label}</label>
                    </div>
                  ))}
                </RadioGroup>
              ) : <p className="text-sm text-gray-500">Nessun docente con permessi da recuperare disponibile in questa fascia.</p>}
            </section>
          </div>
        </ScrollArea>
        <DialogFooter className="flex justify-end space-x-4 mt-4">
          <Button variant="outline" onClick={onClose} size="sm">Annulla</Button>
          <Button onClick={handleConfirm} disabled={!selectedOption} size="sm" className="bg-blue-600 hover:bg-blue-700">OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
