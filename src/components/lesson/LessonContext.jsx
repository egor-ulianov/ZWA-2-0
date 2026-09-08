import { createContext, useContext } from 'react';

const LessonContext = createContext(null);

function createLessonContextValue({ lesson, slides, activeSlide, onChange, mode }) {
  return { lesson, slides, activeSlide, onChange, mode };
}

function useLessonContext() {
  const context = useContext(LessonContext);
  if (!context) {
    throw new Error('useLessonContext must be used within a LessonContext.Provider');
  }
  return context;
}

export { LessonContext, createLessonContextValue, useLessonContext };
export default LessonContext;
