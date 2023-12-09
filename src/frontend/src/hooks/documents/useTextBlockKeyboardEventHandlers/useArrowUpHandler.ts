type UseArrowUpHandlerProps = {
  blockIndex: number;
};

export const useArrowUpHandler = ({ blockIndex }: UseArrowUpHandlerProps) => {
  const doArrowUpOperation = () => {
    const blocksDiv = document.querySelector('.Blocks');

    if (!blocksDiv) return;

    const blockToFocus =
      blocksDiv.querySelectorAll<HTMLDivElement>('.TextBlock')[blockIndex];
    blockToFocus?.querySelector('span')?.focus();
  };

  return doArrowUpOperation;
};
