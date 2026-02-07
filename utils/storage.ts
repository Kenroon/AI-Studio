
import { AppState, WorkoutSession, Routine, ExerciseLog, Exercise, AppSettings } from '../types';
import { DEFAULT_EXERCISES } from '../constants';

const STORAGE_KEY = 'gympro_minimal_state_v4';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  accentColor: '#34C759', // Verde Apple
  bgPattern: 'none'
};

export const saveState = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const loadState = (): AppState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    return {
      routines: parsed.routines || [],
      sessions: parsed.sessions || [],
      bodyWeightLogs: parsed.bodyWeightLogs || [],
      activeSession: parsed.activeSession || null,
      customExercises: parsed.customExercises || DEFAULT_EXERCISES,
      settings: parsed.settings || DEFAULT_SETTINGS
    };
  }
  return {
    routines: [],
    sessions: [],
    bodyWeightLogs: [],
    activeSession: null,
    customExercises: DEFAULT_EXERCISES,
    settings: DEFAULT_SETTINGS
  };
};

export const exportToCSV = (sessions: WorkoutSession[], weightLogs: any[], exercises: Exercise[]) => {
  let csvContent = "data:text/csv;charset=utf-8,Tipo,Fecha,Rutina/Info,Ejercicio,Set,Peso_Reps\n";
  
  sessions.forEach(session => {
    session.logs.forEach(log => {
      const exercise = exercises.find(e => e.id === log.exerciseId);
      log.sets.forEach((set, index) => {
        const row = [
          "Entrenamiento",
          session.date,
          session.routineId,
          exercise?.name || 'Desconocido',
          `Set ${index + 1}`,
          `${set.weight}kg x ${set.reps}`
        ].join(",");
        csvContent += row + "\n";
      });
    });
  });

  weightLogs.forEach(log => {
    const row = [
      "Peso Corporal",
      log.date,
      log.weight,
      "", "", ""
    ].join(",");
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `gym_data_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
