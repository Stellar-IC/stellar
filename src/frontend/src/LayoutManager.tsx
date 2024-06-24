import { useEffect, useState } from 'react';

type LayoutState = 'CLOSED' | 'NAVIGATION_OPEN' | 'PANEL_OPEN';
type Listener = (layout: LayoutState) => void;

class LayoutManager {
  state: LayoutState = 'CLOSED';
  listeners: Array<Listener> = [];

  get layout() {
    return this.state;
  }

  set layout(layout) {
    this.state = layout;
    this.listeners.forEach((listener) => listener(layout));
  }

  addEventListener(callback: Listener) {
    this.listeners.push(callback);
  }

  removeEventListener(callback: Listener) {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }
}

export const layoutManager = new LayoutManager();

export const useLayoutManager = () => {
  const [state, setState] = useState<LayoutState>(layoutManager.layout);

  useEffect(() => {
    const listener = (layout: 'CLOSED' | 'NAVIGATION_OPEN' | 'PANEL_OPEN') => {
      setState(layout);
    };

    layoutManager.addEventListener(listener);

    return () => {
      layoutManager.removeEventListener(listener);
    };
  });

  return { layout: state, layoutManager };
};
