interface UseWordCharacterHandlerProps {
  onCharacterInserted: (cursorPosition: number, character: string) => void;
  hidePlaceholder: () => void;
}

export function useWordCharacterHandler({
  onCharacterInserted,
  hidePlaceholder,
}: UseWordCharacterHandlerProps) {
  const insertCharacter = (character: string, target: HTMLSpanElement) => {
    const cursorPosition = window.getSelection()?.anchorOffset;
    const shouldHidePlaceholder =
      cursorPosition === 0 && target.innerText.length === 0;

    if (cursorPosition === undefined) {
      throw new Error('No cursor position');
    }

    if (shouldHidePlaceholder) {
      hidePlaceholder();
    }

    onCharacterInserted(cursorPosition, character);
  };

  return insertCharacter;
}
