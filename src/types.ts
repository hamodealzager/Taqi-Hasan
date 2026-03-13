export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
}

export interface UserPreferences {
  tone: 'professional' | 'casual' | 'concise' | 'detailed';
  focusArea: string;
  memoryDepth: number; // Number of past interactions to remember
}

export interface AiInteraction {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AppState {
  tasks: Task[];
  notes: Note[];
  preferences: UserPreferences;
  history: AiInteraction[];
}
