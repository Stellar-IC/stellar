export async function focusBlock(uuid: string) {
  const startTime = Date.now();
  const maxWaitTime = 10000;

  const getBlockToFocus = () =>
    new Promise<HTMLDivElement>((resolve, reject) => {
      const interval = setInterval(() => {
        if (Date.now() - startTime > maxWaitTime) {
          clearInterval(interval);
          reject(new Error(`Could not focus block: ${uuid}`));
        }

        const selector = `.FocusableBlock[data-blockid='${uuid}'] span[role="textbox"]`;
        const blockToFocus = document.querySelector<HTMLDivElement>(selector);

        if (blockToFocus) {
          clearInterval(interval);
          resolve(blockToFocus);
        }
      }, 10);
    });

  const blockToFocus = await getBlockToFocus();
  blockToFocus.focus();
}

export function focusNextBlock() {
  const blocksDiv = document.querySelector('.Blocks');
  if (!blocksDiv) return;

  const blockElements = blocksDiv.querySelectorAll<HTMLDivElement>(
    '.FocusableBlock span[role="textbox"]'
  );
  const index = Array.from(blockElements).findIndex(
    (blockElement) => blockElement === document.activeElement
  );

  if (index >= blockElements.length - 1) {
    return;
  }

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
    return;
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
