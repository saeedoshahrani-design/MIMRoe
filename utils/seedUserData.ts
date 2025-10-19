

import { db } from '../firebase.ts';
import { doc, getDoc, writeBatch, collection } from 'firebase/firestore';
import { 
    seedChallenges, 
    seedOpportunities, 
    seedEmployees, 
    seedProcedures,
    seedLeadTasksData,
    departments
} from '../data/mockData.ts';

export const seedUserData = async () => {
  // Use one of the single-doc collections as a flag to check if seeding has occurred.
  const seedCheckRef = doc(db, 'workspaces', 'shared', 'leadTasks', 'main');
  const docSnap = await getDoc(seedCheckRef);

  if (docSnap.exists()) {
    console.log("Shared workspace data already exists. Skipping seed.");
    return;
  }

  console.log(`Seeding initial data for the shared workspace...`);
  try {
      const batch = writeBatch(db);

      // Seed collections with auto-generated IDs
      seedChallenges.forEach(item => {
          const { id, ...data } = item;
          const itemRef = doc(collection(db, 'workspaces', 'shared', 'challenges'));
          batch.set(itemRef, data);
      });
      seedOpportunities.forEach(item => {
          const { id, ...data } = item;
          const itemRef = doc(collection(db, 'workspaces', 'shared', 'opportunities'));
          batch.set(itemRef, data);
      });
      seedEmployees.forEach(item => {
          const { id, ...data } = item;
          const itemRef = doc(collection(db, 'workspaces', 'shared', 'employees'));
          batch.set(itemRef, data);
      });
      seedProcedures.forEach(item => {
          const { id, ...data } = item;
          const itemRef = doc(collection(db, 'workspaces', 'shared', 'procedures'));
          batch.set(itemRef, data);
      });

      // Seed single-document collections (using the ref from our check)
      batch.set(seedCheckRef, seedLeadTasksData);

      // Seed department-specific data (tasks and targets)
      departments.forEach(dept => {
           const deptDataRef = doc(db, 'workspaces', 'shared', 'departmentData', dept.id);
           batch.set(deptDataRef, { tasks: [], targets: [] });
      });
      
      await batch.commit();
      console.log(`Shared workspace data seeding complete.`);
  } catch (error) {
      console.error(`Error seeding shared workspace data:`, error);
  }
};