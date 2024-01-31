export function focusNextBlock() {
  const blocksDiv = document.querySelector('.Blocks');
  if (!blocksDiv) return;

  const blockElements = blocksDiv.querySelectorAll<HTMLDivElement>(
    '.FocusableBlock span[role="textbox"]'
  );
  const index = Array.from(blockElements).findIndex(
    (blockElement) => blockElement === document.activeElement
  );

  const indexToFocus = index + 1;
  const blockToFocus = blockElements[indexToFocus];

  blockToFocus?.focus();
}

export function focusPreviousBlock(shouldFocusEnd = false) {
  const blocksDiv = document.querySelector('.Blocks');
  if (!blocksDiv) return;

  const blockElements = blocksDiv.querySelectorAll<HTMLDivElement>(
    '.FocusableBlock span[role="textbox"]'
  );
  const index = Array.from(blockElements).findIndex(
    (blockElement) => blockElement === document.activeElement
  );

  if (index === 0) {
    throw new Error('Cannot focus previous block');
  }

  const indexToFocus = index - 1;
  const blockToFocus = blockElements[indexToFocus];
  const textNode = blockToFocus?.childNodes[0];

  blockToFocus?.focus();

  if (shouldFocusEnd) {
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      if (textNode) {
        range.selectNodeContents(textNode);
      } else {
        range.setStart(blockToFocus, 0);
        range.setEnd(blockToFocus, 0);
      }
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}
