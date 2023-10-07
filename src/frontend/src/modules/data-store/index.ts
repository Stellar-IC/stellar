import { useState } from 'react';

const useDataStore = () => {
  const [data, setData] = useState({
    pages: [],
    block: [],
  });

  return {
    data,
    setData,
  };
};
