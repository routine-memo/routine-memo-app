import { useState, useEffect } from 'react';

export const useContainerWidth = (blockPositionsLength: number) => {
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    const updateContainerWidth = () => {
      const container = document.getElementById('blocks-container');
      if (container) {
        const width = container.clientWidth;
        setContainerWidth(width);
      } else {
        const width = window.innerWidth - 32;
        setContainerWidth(width);
      }
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);

    return () => window.removeEventListener('resize', updateContainerWidth);
  }, [blockPositionsLength]);

  return containerWidth;
};
