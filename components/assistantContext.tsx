// components/assistantContext.tsx

import { createContext, useContext, useState, ReactNode } from 'react';

// Define the structure for assistant object
interface Assistant {
  name: string;
  prompt: string;
  voice: string;
  description: string;
}

interface AssistantContextType {
  assistant: Assistant | null;
  setAssistant: (assistant: Assistant | null) => void;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [assistant, setAssistant] = useState<Assistant | null>(null);

  return (
    <AssistantContext.Provider value={{ assistant, setAssistant }}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (context === undefined) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
}
