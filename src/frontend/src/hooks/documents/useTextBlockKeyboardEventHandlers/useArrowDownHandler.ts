type UseArrowDownHandlerProps = {
  blockIndex: number;
};

export const useArrowDownHandler = ({
  blockIndex,
}: UseArrowDownHandlerProps) => {
  const doArrowDownOperation = () => {
    const blocksDiv = document.querySelector('.Blocks');

    if (!blocksDiv) return;

    const blockToFocus =
      blocksDiv.querySelectorAll<HTMLDivElement>('.TextBlock')[blockIndex + 2];

    blockToFocus?.querySelector('span')?.focus();
  };

  return doArrowDownOperation;
};
