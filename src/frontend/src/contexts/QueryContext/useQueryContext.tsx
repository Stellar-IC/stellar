import React from 'react';

import { QueryContext } from './QueryContext';

export function useQueryContext() {
  const context = React.useContext(QueryContext);

  if (!context) {
    throw new Error(
      'useQueryContext must be used within a QueryContextProvider'
    );
  }

  return context;
}
