import { createContext, useContext } from 'react';

const LearningContext = createContext(null);

export function createLearningContextValue({ lesson, sections, activeSection, onChange, mode }) {
  return { lesson, sections, activeSection, onChange, mode };
}

export function useLearningContext() {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error('useLearningContext must be used within a LearningContext.Provider');
  }
  return context;
}

export { LearningContext };
