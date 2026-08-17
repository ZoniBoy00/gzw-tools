import { useContext } from 'react';
import { DataContext } from './DataContext';

export function useDataContext() {
  return useContext(DataContext);
}