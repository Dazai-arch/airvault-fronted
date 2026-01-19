import { createContext, useContext, useState } from "react";

const VaultContext = createContext();

export const VaultProvider = ({ children }) => {
  const [activeVault, setActiveVault] = useState(null);

  return (
    <VaultContext.Provider value={{ activeVault, setActiveVault }}>
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => useContext(VaultContext);
