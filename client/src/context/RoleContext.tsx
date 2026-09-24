import { createContext, useContext, useState, type ReactNode } from 'react';

export type UserRole = 'user' | 'investigator' | 'authority' | 'admin';

interface RoleContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  roleLabel: string;
}

const roleLabels: Record<UserRole, string> = {
  user: 'Standard User',
  investigator: 'Investigator',
  authority: 'Police / Authority',
  admin: 'Admin',
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('user');

  return (
    <RoleContext.Provider value={{ currentRole, setCurrentRole, roleLabel: roleLabels[currentRole] }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) throw new Error('useRole must be used within a RoleProvider');
  return context;
};

export { roleLabels };
