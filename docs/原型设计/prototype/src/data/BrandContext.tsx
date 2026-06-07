import { createContext, useContext } from 'react';

export interface BrandContextValue {
  currentBrandId: number; // 0 = 全部
  currentBrandName: string; // 全部 或品牌名
}

export const BrandContext = createContext<BrandContextValue>({ currentBrandId: 0, currentBrandName: '全部' });

export function useBrandContext() {
  return useContext(BrandContext);
}
