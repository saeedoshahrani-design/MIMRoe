import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Employee } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, writeBatch } from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface EmployeeContextType {
    employees: Employee[];
    addEmployee: (data: Omit<Employee, 'id'>) => Promise<void>;
    updateEmployee: (id: string, data: Partial<Omit<Employee, 'id'>>) => Promise<void>;
    deleteEmployee: (id: string) => Promise<void>;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

const COLLECTION_NAME = 'employees';

const toUtcDateString = (dateStr: string | undefined | null) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr; // Return as is if not YYYY-MM-DD or is already a full ISO string
    }
    return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
};

export const EmployeeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);

    useEffect(() => {
        if (!user) {
            setEmployees([]);
            return;
        }

        const collRef = collection(db, 'workspaces', 'shared', COLLECTION_NAME);
        const q = query(collRef);
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const employeesFromDb = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Ensure localized array fields exist to prevent crashes
                    qualifications: data.qualifications || { en: [], ar: [] },
                    certifications: data.certifications || { en: [], ar: [] },
                    trainingCourses: data.trainingCourses || { en: [], ar: [] },
                    tasks: data.tasks || { en: [], ar: [] },
                    achievements: data.achievements || { en: [], ar: [] },
                } as Employee;
            });
            employeesFromDb.sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());
            setEmployees(employeesFromDb);
        }, (error) => {
            console.error("Error listening to employees collection:", error);
        });

        return () => unsubscribe();
    }, [user]);

    const addEmployee = useCallback(async (data: Omit<Employee, 'id'>) => {
        if (!user) throw new Error("User not authenticated");
        const plainData = JSON.parse(JSON.stringify({
            ...data,
            joinDate: toUtcDateString(data.joinDate)
        }));
        await addDoc(collection(db, 'workspaces', 'shared', COLLECTION_NAME), plainData);
    }, [user]);

    const updateEmployee = useCallback(async (id: string, data: Partial<Omit<Employee, 'id'>>) => {
        if (!user) throw new Error("User not authenticated");
        const employeeDoc = doc(db, 'workspaces', 'shared', COLLECTION_NAME, id);
        
        const updateData = { ...data };
        if(updateData.joinDate) {
            updateData.joinDate = toUtcDateString(updateData.joinDate) as string;
        }
        
        const plainData = JSON.parse(JSON.stringify(updateData));
        await updateDoc(employeeDoc, plainData);
    }, [user]);

    const deleteEmployee = useCallback(async (id: string) => {
        if (!user) throw new Error("User not authenticated");
        const employeeDoc = doc(db, 'workspaces', 'shared', COLLECTION_NAME, id);
        await deleteDoc(employeeDoc);
    }, [user]);

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