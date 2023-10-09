import React from 'react';
import { WorkspaceContext } from './WorkspaceContext';

export function useWorkspaceContext() {
  const context = React.useContext(WorkspaceContext);

  if (!context) {
    throw new Error(
      'useWorkspaceContext must be used within a WorkspaceContextProvider'
    );
  }

  return context;
}
