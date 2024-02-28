import React from 'react';

import { DataStoreContext } from './DataStoreContext';

export function useDataStoreContext() {
  const context = React.useContext(DataStoreContext);

  if (!context) {
    throw new Error(
      'useDataStoreContext must be used within a DataStoreContextProvider'
    );
  }

  return context;
}
