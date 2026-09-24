'use client';

import React, { createContext, useContext, useState, useRef } from 'react';

interface VisitorContextType {
  username: string | null;
  isDialogOpen: boolean;
  requireVisitor: () => Promise<boolean>;
  resolveVisitor: (newUsername: string) => void;
  cancelVisitor: () => void;
}

const VisitorContext = createContext<VisitorContextType | undefined>(undefined);

export const VisitorProvider = ({ 
  children, 
  initialUsername = null 
}: { 
  children: React.ReactNode; 
  initialUsername?: string | null; 
}) => {
  const [username, setUsername] = useState<string | null>(initialUsername);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // useRef para guardar de forma mutable la función resolve pendiente sin causar re-renders
  const resolverRef = useRef<((success: boolean) => void) | null>(null);

  // La función guardiana que llaman los botones (ej. "Me gusta")
  const requireVisitor = (): Promise<boolean> => {
    // Si ya tiene un username registrado, pasa inmediatamente con éxito
    if (username) {
      return Promise.resolve(true);
    }

    // Si no tiene username, abrimos el diálogo y devolvemos una promesa en espera
    setIsDialogOpen(true);

    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  };

  // Se ejecuta cuando el usuario escribe su nombre y lo guarda con éxito
  const resolveVisitor = (newUsername: string) => {
    setUsername(newUsername);
    setIsDialogOpen(false);

    // Si hay una promesa esperando, la resolvemos con true
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  // Se ejecuta si el usuario presiona "Cancelar" o cierra el diálogo
  const cancelVisitor = () => {
    setIsDialogOpen(false);

    // Si hay una promesa esperando, la resolvemos con false para cancelar la acción
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  return (
    <VisitorContext.Provider 
      value={{ 
        username, 
        isDialogOpen, 
        requireVisitor, 
        resolveVisitor, 
        cancelVisitor 
      }}
    >
      {children}
    </VisitorContext.Provider>
  );
};

export const useVisitor = () => {
  const context = useContext(VisitorContext);
  if (!context) {
    throw new Error('useVisitor debe usarse dentro de un VisitorProvider');
  }
  return context;
};