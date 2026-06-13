import { createContext, useContext, useState, ReactNode } from 'react';

export interface BrandConfigItem {
  brandId: number;
  showPurchaserTab: boolean;
  showFactoryTab: boolean;
  allowCreatePurchaser: boolean;
  allowCreateFactory: boolean;
}

interface BrandConfigContextType {
  configs: BrandConfigItem[];
  updateConfig: (brandId: number, updates: Partial<BrandConfigItem>) => void;
  getConfig: (brandId: number) => BrandConfigItem;
}

const defaultConfig: BrandConfigItem = {
  brandId: 0,
  showPurchaserTab: true,
  showFactoryTab: true,
  allowCreatePurchaser: true,
  allowCreateFactory: false,
};

const BrandConfigContext = createContext<BrandConfigContextType>({
  configs: [],
  updateConfig: () => {},
  getConfig: () => defaultConfig,
});

export function BrandConfigProvider({ children }: { children: ReactNode }) {
  const [configs, setConfigs] = useState<BrandConfigItem[]>([]);

  const getConfig = (brandId: number): BrandConfigItem => {
    return configs.find(c => c.brandId === brandId) || { ...defaultConfig, brandId };
  };

  const updateConfig = (brandId: number, updates: Partial<BrandConfigItem>) => {
    setConfigs(prev => {
      const idx = prev.findIndex(c => c.brandId === brandId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...updates };
        return next;
      }
      return [...prev, { ...defaultConfig, brandId, ...updates }];
    });
  };

  return (
    <BrandConfigContext.Provider value={{ configs, updateConfig, getConfig }}>
      {children}
    </BrandConfigContext.Provider>
  );
}

export function useBrandConfig() {
  return useContext(BrandConfigContext);
}
