import { useCallback } from 'react';

interface UseWordCharacterHandlerProps {
  onCharacterInserted: (
    e: React.KeyboardEvent<HTMLSpanElement>,
    cursorPosition: number,
    character: string
  ) => Promise<void>;
  hidePlaceholder: () => void;
}

export function useWordCharacterHandler({
  onCharacterInserted,
  hidePlaceholder,
}: UseWordCharacterHandlerProps) {
  const insertCharacter = useCallback(
    async (e: React.KeyboardEvent<HTMLSpanElement>, character: string) => {
      const cursorPosition = window.getSelection()?.anchorOffset;
      const shouldHidePlaceholder =
        cursorPosition === 0 && e.currentTarget.innerText.length === 0;

      if (cursorPosition === undefined) {
        throw new Error('No cursor position');
      }

      if (shouldHidePlaceholder) {
        hidePlaceholder();
      }

      await onCharacterInserted(e, cursorPosition, character);
    },
    [hidePlaceholder, onCharacterInserted]
  );

  return insertCharacter;
}
