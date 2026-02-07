
export enum MuscleGroup {
  CHEST = 'Pecho',
  BACK = 'Espalda',
  LEGS = 'Piernas',
  SHOULDERS = 'Hombros',
  ARMS = 'Brazos',
  CORE = 'Core'
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
}

export interface SetLog {
  reps: number;
  weight: number;
  note?: string;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
}

export interface Routine {
  id: string;
  name: string;
  exerciseIds: string[];
}

export interface WorkoutSession {
  id: string;
  date: string;
  timestamp: number;
  routineId: string;
  logs: ExerciseLog[];
}

export interface BodyWeightLog {
  id: string;
  date: string;
  timestamp: number;
  weight: number;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  accentColor: string;
  bgPattern: string;
}

export interface AppState {
  routines: Routine[];
  sessions: WorkoutSession[];
  bodyWeightLogs: BodyWeightLog[];
  activeSession: WorkoutSession | null;
  customExercises: Exercise[];
  settings: AppSettings;
}
