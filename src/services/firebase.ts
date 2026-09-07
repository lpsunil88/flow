import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  Firestore,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Document, Client, Item, ProductList, CompanyProfile, CurrencyConfig, StaffUser } from '../types';

// 1. Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. Initialize Firestore with named database ID from firebase-applet-config.json
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const FIRESTORE_PROJECT_ID = firebaseConfig.projectId;
export const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId;

// 3. Connection Test
export async function testFirestoreConnection(): Promise<{ success: boolean; message: string }> {
  try {
    // Attempt reading test connection doc from server
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { success: true, message: 'Connected to Firebase Firestore' };
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      return { success: false, message: 'Firestore client is currently offline or unreachable.' };
    }
    // If document just doesn't exist, it's still a successful connection
    if (error instanceof Error && (error.message.includes('permission') || error.message.includes('PERMISSION_DENIED'))) {
      return { success: false, message: 'Firestore permission error: ' + error.message };
    }
    return { success: true, message: 'Connected to Firebase Firestore' };
  }
}

// 4. Documents CRUD
export async function saveDocumentToFirestore(document: Document): Promise<void> {
  const docRef = doc(db, 'documents', document.id);
  // Clean undefined values for Firestore compatibility
  const cleanData = JSON.parse(JSON.stringify(document));
  await setDoc(docRef, cleanData, { merge: true });
}

export async function deleteDocumentFromFirestore(docId: string): Promise<void> {
  const docRef = doc(db, 'documents', docId);
  await deleteDoc(docRef);
}

export function subscribeToFirestoreDocuments(onData: (docs: Document[]) => void, onError?: (err: Error) => void): Unsubscribe {
  const colRef = collection(db, 'documents');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const docs: Document[] = [];
      snapshot.forEach((snap) => {
        docs.push(snap.data() as Document);
      });
      onData(docs);
    },
    (err) => {
      console.warn('Firestore documents subscription error:', err);
      if (onError) onError(err);
    }
  );
}

export async function fetchAllDocumentsFromFirestore(): Promise<Document[]> {
  const colRef = collection(db, 'documents');
  const snapshot = await getDocs(colRef);
  const docs: Document[] = [];
  snapshot.forEach((snap) => {
    docs.push(snap.data() as Document);
  });
  return docs;
}

// 5. Clients CRUD
export async function saveClientToFirestore(client: Client): Promise<void> {
  const docRef = doc(db, 'clients', client.id);
  const cleanData = JSON.parse(JSON.stringify(client));
  await setDoc(docRef, cleanData, { merge: true });
}

export async function deleteClientFromFirestore(clientId: string): Promise<void> {
  const docRef = doc(db, 'clients', clientId);
  await deleteDoc(docRef);
}

export function subscribeToFirestoreClients(onData: (clients: Client[]) => void, onError?: (err: Error) => void): Unsubscribe {
  const colRef = collection(db, 'clients');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const clients: Client[] = [];
      snapshot.forEach((snap) => {
        clients.push(snap.data() as Client);
      });
      onData(clients);
    },
    (err) => {
      console.warn('Firestore clients subscription error:', err);
      if (onError) onError(err);
    }
  );
}

// 6. Items CRUD
export async function saveItemToFirestore(item: Item): Promise<void> {
  const docRef = doc(db, 'items', item.id);
  const cleanData = JSON.parse(JSON.stringify(item));
  await setDoc(docRef, cleanData, { merge: true });
}

export async function deleteItemFromFirestore(itemId: string): Promise<void> {
  const docRef = doc(db, 'items', itemId);
  await deleteDoc(docRef);
}

export function subscribeToFirestoreItems(onData: (items: Item[]) => void, onError?: (err: Error) => void): Unsubscribe {
  const colRef = collection(db, 'items');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Item[] = [];
      snapshot.forEach((snap) => {
        items.push(snap.data() as Item);
      });
      onData(items);
    },
    (err) => {
      console.warn('Firestore items subscription error:', err);
      if (onError) onError(err);
    }
  );
}

// 7. Companies CRUD
export async function saveCompanyToFirestore(company: CompanyProfile): Promise<void> {
  const docRef = doc(db, 'companies', company.id);
  const cleanData = JSON.parse(JSON.stringify(company));
  await setDoc(docRef, cleanData, { merge: true });
}

export function subscribeToFirestoreCompanies(onData: (comps: CompanyProfile[]) => void, onError?: (err: Error) => void): Unsubscribe {
  const colRef = collection(db, 'companies');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const comps: CompanyProfile[] = [];
      snapshot.forEach((snap) => {
        comps.push(snap.data() as CompanyProfile);
      });
      onData(comps);
    },
    (err) => {
      console.warn('Firestore companies subscription error:', err);
      if (onError) onError(err);
    }
  );
}

// 8. Product Lists CRUD
export async function saveProductListToFirestore(list: ProductList): Promise<void> {
  const docRef = doc(db, 'productLists', list.id);
  const cleanData = JSON.parse(JSON.stringify(list));
  await setDoc(docRef, cleanData, { merge: true });
}

export function subscribeToFirestoreProductLists(onData: (lists: ProductList[]) => void, onError?: (err: Error) => void): Unsubscribe {
  const colRef = collection(db, 'productLists');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const lists: ProductList[] = [];
      snapshot.forEach((snap) => {
        lists.push(snap.data() as ProductList);
      });
      onData(lists);
    },
    (err) => {
      console.warn('Firestore product lists subscription error:', err);
      if (onError) onError(err);
    }
  );
}

// 9. Bulk Initial Sync
export async function pushAllLocalDataToFirestore(params: {
  documents: Document[];
  clients: Client[];
  items: Item[];
  companies: CompanyProfile[];
  productLists: ProductList[];
}): Promise<{ success: boolean; syncedCount: number; error?: string }> {
  try {
    let count = 0;
    for (const docItem of params.documents) {
      await saveDocumentToFirestore(docItem);
      count++;
    }
    for (const client of params.clients) {
      await saveClientToFirestore(client);
      count++;
    }
    for (const item of params.items) {
      await saveItemToFirestore(item);
      count++;
    }
    for (const comp of params.companies) {
      await saveCompanyToFirestore(comp);
      count++;
    }
    for (const list of params.productLists) {
      await saveProductListToFirestore(list);
      count++;
    }
    return { success: true, syncedCount: count };
  } catch (err: any) {
    console.error('Failed to sync data to Firestore:', err);
    return { success: false, syncedCount: 0, error: err?.message || 'Unknown Firestore error' };
  }
}
