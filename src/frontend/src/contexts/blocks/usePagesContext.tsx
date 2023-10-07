import React from 'react';
import { PagesContext } from './PagesContext';

export function usePagesContext() {
  const context = React.useContext(PagesContext);

  if (!context) {
    throw new Error('usePagesContext must be used within a PagesContextProvider');
  }

  return context;
}
