export enum EditorAction {
  ArrowDown = 'ArrowDown',
  ArrowUp = 'ArrowUp',
  Backspace = 'Backspace',
  Character = 'Character',
  Enter = 'Enter',
  ShiftTab = 'ShiftTab',
  Tab = 'Tab',
}

export function fromKeyboardEvent(
  e: React.KeyboardEvent<HTMLSpanElement>
): EditorAction {
  const { key, shiftKey, metaKey, ctrlKey } = e;

  if (key === 'Enter' && !shiftKey) return EditorAction.Enter;
  if (key === 'Tab') {
    if (shiftKey) return EditorAction.ShiftTab;
    return EditorAction.Tab;
  }
  if (key === 'Backspace') return EditorAction.Backspace;
  if (key === 'ArrowDown') return EditorAction.ArrowDown;
  if (key === 'ArrowUp') return EditorAction.ArrowUp;
  if (key.match(/^[\w\W]$/g) && !metaKey && !ctrlKey) {
    return EditorAction.Character;
  }

  throw new Error('Unhandled keydown event');
}
