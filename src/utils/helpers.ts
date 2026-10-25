
// Genera un ID casuale
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Converte il formato dell'orario da array a oggetto di orari
export function convertScheduleFormat(arraySchedule: any): any {
  if (!arraySchedule) return createEmptySchedule();
  
  const hours = ['8:30', '9:30', '10:30', '11:30', '12:30', '13:30', '14:30'];
  const result: any = {};
  
  // Per ogni giorno, crea un oggetto con gli orari come chiavi
  Object.keys(arraySchedule).forEach(day => {
    result[day] = {};
    
    // Se il giorno ha un array di classi, converte in un oggetto orario->classe
    if (Array.isArray(arraySchedule[day])) {
      arraySchedule[day].forEach((className: string | null, index: number) => {
        if (index < hours.length) {
          result[day][hours[index]] = className || '';
        }
      });
    } 
    // Se il giorno è già in formato oggetto, lo mantiene
    else if (typeof arraySchedule[day] === 'object') {
      result[day] = arraySchedule[day];
    }
  });
  
  return result;
}

// Esporta dati in formato JSON
export function exportToJson(data: any): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `sostituzioni-docenti-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Importa dati da JSON
export function importFromJson(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        let data = JSON.parse(event.target?.result as string);
        
        // Controlla se è un array di insegnanti (formato alternativo)
        if (Array.isArray(data)) {
          // Converte il formato dell'orario di ogni insegnante
          data = data.map(teacher => ({
            ...teacher,
            schedule: convertScheduleFormat(teacher.schedule),
            // Assicurati che l'insegnante abbia un array permissions
            permissions: teacher.permissions || []
          }));
          
          data = { teachers: data, replacements: [] };
        } 
        // Altrimenti, per ogni insegnante, assicurati che l'orario sia nel formato corretto
        else if (data.teachers) {
          data.teachers = data.teachers.map((teacher: any) => ({
            ...teacher,
            schedule: convertScheduleFormat(teacher.schedule),
            permissions: teacher.permissions || []
          }));
        }
        
        resolve(data);
      } catch (error) {
        reject(new Error('Il file non è in formato JSON valido.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Errore durante la lettura del file.'));
    };
    
    reader.readAsText(file);
  });
}

// Importa l'orario docenti da un file Excel (.xlsx/.xls/.csv).
// Il foglio usa la prima colonna per il docente e 6 colonne per ogni giorno.
// Le celle unite orizzontalmente rappresentano una lezione di più ore: il valore
// viene copiato in ogni ora coperta dalla cella unita.
export async function importTeachersFromExcel(file: File): Promise<any[]> {
  const XLSX: any = await import(/* @vite-ignore */ 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!sheet || !sheet['!ref']) {
    throw new Error('Il file Excel non contiene un foglio con dati.');
  }

  const range = XLSX.utils.decode_range(sheet['!ref']);
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: true,
  });
  const days = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  const hours = ['8:30', '9:30', '10:30', '11:30', '12:30', '13:30'];
  const mergedValues = new Map<string, string>();

  // Registra ogni cella unita sulle colonne dell'orario. La cella iniziale è
  // l'unica a contenere il testo nel file Excel, ma vale per tutta l'unione.
  for (const merge of (sheet['!merges'] || [])) {
    if (merge.s.r < 2 || merge.s.c < 1 || merge.e.c <= merge.s.c) continue;
    const startDay = Math.floor((merge.s.c - 1) / 6);
    const endDay = Math.floor((merge.e.c - 1) / 6);
    if (startDay !== endDay || startDay < 0 || startDay >= days.length) continue;
    const startCell = sheet[XLSX.utils.encode_cell(merge.s)];
    const value = String(startCell?.w ?? startCell?.v ?? '').trim();
    if (!value) continue;
    for (let col = merge.s.c; col <= merge.e.c; col++) {
      mergedValues.set(`${merge.s.r}:${col}`, value);
    }
  }

  const teachersByName = new Map<string, any>();
  for (let rowIndex = 2; rowIndex <= range.e.r; rowIndex++) {
    const row = rows[rowIndex] || [];
    const name = String(row[0] ?? '').trim();
    if (!name) continue;
    // Esclude eventuali righe di intestazione ripetute o di note.
    if (/^(docente|docenti|orario)$/i.test(name)) continue;

    const schedule = createEmptySchedule();
    for (let col = 1; col <= Math.min(36, range.e.c); col++) {
      const dayIndex = Math.floor((col - 1) / 6);
      const hourIndex = (col - 1) % 6;
      const merged = mergedValues.get(`${rowIndex}:${col}`);
      const value = String(merged ?? row[col] ?? '').trim();
      if (value) schedule[days[dayIndex]][hours[hourIndex]] = value;
    }

    const key = name.toLocaleLowerCase('it');
    const previous = teachersByName.get(key);
    teachersByName.set(key, {
      id: previous?.id ?? generateId(),
      name,
      schedule,
      permissions: previous?.permissions ?? [],
    });
  }

  if (teachersByName.size === 0) {
    throw new Error('Nel foglio Excel non ho trovato docenti. Verifica che i nomi siano nella prima colonna e gli orari nelle 36 colonne successive.');
  }
  return Array.from(teachersByName.values());
}

// Importa l'orario docenti da un PDF testuale (come il tabellone ufficiale).
// PDF.js viene caricato dal CDN solo quando si sceglie un PDF, senza modificare
// il resto dell'applicazione o aggiungere dipendenze di build.
export async function importTeachersFromPdf(file: File): Promise<any[]> {
  // @ts-ignore - modulo ESM caricato a runtime dal CDN
  const pdfjs: any = await import(/* @vite-ignore */ 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: any[] = [];
  let slotPositions: number[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items
      .filter((item: any) => typeof item.str === 'string' && item.str.trim())
      .map((item: any) => ({
        text: item.str.trim(),
        x: Number(item.transform?.[4] ?? 0),
        y: Number(item.transform?.[5] ?? 0),
        top: page.view[3] - Number(item.transform?.[5] ?? 0),
      }));

    if (pageNumber === 1) {
      const header = items.filter((item: any) => item.top >= 52 && item.top <= 68 && /^(8\.30|9\.30|10\.30|11\.30|12\.30|13\.30)$/.test(item.text));
      slotPositions = header.map((item: any) => item.x).sort((a: number, b: number) => a - b);
      // Il PDF ha 36 colonne (6 ore per ciascuno dei 6 giorni).
      if (slotPositions.length > 36) slotPositions = slotPositions.slice(0, 36);
    }

    const sorted = items.sort((a: any, b: any) => b.y - a.y || a.x - b.x);
    const rows: any[][] = [];
    for (const item of sorted) {
      let row = rows.find((candidate) => Math.abs(candidate[0].y - item.y) < 1.8);
      if (!row) {
        row = [];
        rows.push(row);
      }
      row.push(item);
    }
    pages.push(rows);
  }

  if (slotPositions.length !== 36) {
    throw new Error('Non riesco a riconoscere le 36 colonne dell’orario nel PDF.');
  }

  const days = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  const hours = ['8:30', '9:30', '10:30', '11:30', '12:30', '13:30'];
  const teachersByName = new Map<string, any>();

  for (const rows of pages) {
    for (const row of rows) {
      row.sort((a: any, b: any) => a.x - b.x);
      const nameParts = row.filter((item: any) => item.x < 70 && item.top > 65 && item.top < 570);
      if (!nameParts.length) continue;
      const name = nameParts.map((item: any) => item.text).join(' ').replace(/\s+/g, ' ').trim();
      if (!name || /^(TABELLONE|DOCENTI|Pag\.)/i.test(name)) continue;

      const schedule = createEmptySchedule();
      const cellParts = new Map<number, any[]>();
      for (const item of row.filter((candidate: any) => candidate.x >= 70)) {
        let nearest = 0;
        let distance = Number.POSITIVE_INFINITY;
        slotPositions.forEach((position: number, index: number) => {
          const nextDistance = Math.abs(item.x - position);
          if (nextDistance < distance) {
            distance = nextDistance;
            nearest = index;
          }
        });
        if (!cellParts.has(nearest)) cellParts.set(nearest, []);
        cellParts.get(nearest)!.push(item);
      }

      for (const [slot, parts] of cellParts.entries()) {
        const value = parts.sort((a: any, b: any) => a.x - b.x).map((part: any) => part.text).join(' ').replace(/\s+/g, ' ').trim();
        if (value) schedule[days[Math.floor(slot / 6)]][hours[slot % 6]] = value;
      }

      const key = name.toLocaleLowerCase('it');
      const previous = teachersByName.get(key);
      teachersByName.set(key, {
        id: previous?.id ?? generateId(),
        name,
        schedule,
        permissions: previous?.permissions ?? [],
      });
    }
  }

  if (teachersByName.size === 0) {
    throw new Error('Nel PDF non ho trovato righe docenti leggibili.');
  }
  return Array.from(teachersByName.values());
}

// Crea un orario vuoto per un nuovo docente
export function createEmptySchedule() {
  const days = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  const hours = ['8:30', '9:30', '10:30', '11:30', '12:30', '13:30', '14:30'];
  
  const schedule: any = {};
  
  days.forEach(day => {
    schedule[day] = {};
    hours.forEach(hour => {
      schedule[day][hour] = '';
    });
  });
  
  return schedule;
}
