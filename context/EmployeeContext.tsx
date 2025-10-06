import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Employee } from '../types';
import { loadBox, saveBox } from '../utils/storage';
import { seedEmployees } from '../data/mockData';

interface EmployeeContextType {
    employees: Employee[];
    addEmployee: (data: Omit<Employee, 'id'>) => void;
    updateEmployee: (id: string, data: Employee) => void;
    deleteEmployee: (id: string) => void;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

const LS_KEY = 'employees';

export const EmployeeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [employees, setEmployees] = useState<Employee[]>(() => loadBox<Employee[]>(LS_KEY, seedEmployees));

    useEffect(() => {
        saveBox(LS_KEY, employees);
    }, [employees]);

    const addEmployee = useCallback((data: Omit<Employee, 'id'>) => {
        const newEmployee: Employee = {
            ...data,
            id: `emp${Date.now()}`,
        };
        setEmployees(prev => [newEmployee, ...prev]);
    }, []);

    const updateEmployee = useCallback((id: string, data: Employee) => {
        setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...data } : emp));
    }, []);

    const deleteEmployee = useCallback((id: string) => {
        setEmployees(prev => prev.filter(emp => emp.id !== id));
    }, []);

    const value = { employees, addEmployee, updateEmployee, deleteEmployee };

    return (
        <EmployeeContext.Provider value={value}>
            {children}
        </EmployeeContext.Provider>
    );
};

export const useEmployeeContext = (): EmployeeContextType => {
    const context = useContext(EmployeeContext);
    if (!context) {
        throw new Error('useEmployeeContext must be used within an EmployeeProvider');
    }
    return context;
};