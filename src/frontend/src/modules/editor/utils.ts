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

export function focusPreviousBlock() {
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