function _getRangeSelectionEndpoints(selection: Selection) {
  let startCursor = selection.anchorOffset;
  let endCursor = selection.focusOffset;

  if (startCursor > endCursor) {
    startCursor = selection.focusOffset;
    endCursor = selection.anchorOffset;
  }

  return [startCursor, endCursor];
}

export const deleteCharactersInSelectionRange = (
  e: React.KeyboardEvent<HTMLSpanElement>,
  selection: Selection,
  opts: {
    onRemove: (startCursor: number, endCursor?: number) => void;
  }
) => {
  const [startCursor, endCursor] = _getRangeSelectionEndpoints(selection);
  const { onRemove } = opts;

  onRemove(startCursor, endCursor);
  selection?.deleteFromDocument();

  return false;
};

export function setCursorAtEnd(target: HTMLSpanElement) {
  const selection = window.getSelection();

  if (selection) {
    const range = document.createRange();

    range.setStart(target.childNodes[0], target.innerText.length);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);
  }
}
