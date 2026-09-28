import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ChapterProgress, DailyPlan, MockTestResult } from '../types/jee';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: Must use firestoreDatabaseId from firebaseConfig
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error handling conforming to Firebase skill specs
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot as required by skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
      return false;
    }
    return true;
  }
}

// Authentication
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error('Sign in with Google error:', err);
    throw err;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Sign out error:', err);
    throw err;
  }
}

export interface UserProfileData {
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  super50Roll?: string;
  targetAir?: string;
  targetPercentile?: string;
  dailyStreak: number;
  totalStudyHours: number;
  createdAt?: string;
  updatedAt: string;
}

// Firestore Operations: User Profile
export async function saveUserProfile(userId: string, data: Partial<UserProfileData>): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        ...data,
        userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// Firestore Operations: Chapter Progress
export async function saveChapterProgress(
  userId: string,
  chapterId: string,
  progress: ChapterProgress
): Promise<void> {
  const path = `users/${userId}/chapters/${chapterId}`;
  try {
    const ref = doc(db, 'users', userId, 'chapters', chapterId);
    await setDoc(
      ref,
      {
        ...progress,
        userId,
        chapterId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getAllChapterProgress(
  userId: string
): Promise<Record<string, ChapterProgress>> {
  const path = `users/${userId}/chapters`;
  try {
    const colRef = collection(db, 'users', userId, 'chapters');
    const snap = await getDocs(colRef);
    const result: Record<string, ChapterProgress> = {};
    snap.forEach((d) => {
      const data = d.data();
      result[d.id] = {
        theory: !!data.theory,
        conclusion1Page: !!data.conclusion1Page,
        mathongo: !!data.mathongo,
        moduleEx2: !!data.moduleEx2,
        eklavya: !!data.eklavya,
        prevPartTest: !!data.prevPartTest,
        notes: data.notes || '',
        mathongoSolved: data.mathongoSolved || 0,
        moduleEx2Solved: data.moduleEx2Solved || 0,
        eklavyaSolved: data.eklavyaSolved || 0,
        confidenceRating: data.confidenceRating || 2,
        lastUpdated: data.updatedAt,
      };
    });
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return {};
  }
}

// Firestore Operations: Daily Plans
export async function saveDailyPlan(userId: string, plan: DailyPlan): Promise<void> {
  const path = `users/${userId}/daily_plans/${plan.date}`;
  try {
    const ref = doc(db, 'users', userId, 'daily_plans', plan.date);
    await setDoc(
      ref,
      {
        ...plan,
        userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getAllDailyPlans(userId: string): Promise<Record<string, DailyPlan>> {
  const path = `users/${userId}/daily_plans`;
  try {
    const colRef = collection(db, 'users', userId, 'daily_plans');
    const snap = await getDocs(colRef);
    const result: Record<string, DailyPlan> = {};
    snap.forEach((d) => {
      result[d.id] = d.data() as DailyPlan;
    });
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return {};
  }
}

// Firestore Operations: Mock Test Results
export async function saveMockTestResult(userId: string, result: MockTestResult): Promise<void> {
  const path = `users/${userId}/mock_results/${result.id}`;
  try {
    const ref = doc(db, 'users', userId, 'mock_results', result.id);
    await setDoc(
      ref,
      {
        ...result,
        userId,
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMockTestResult(userId: string, resultId: string): Promise<void> {
  const path = `users/${userId}/mock_results/${resultId}`;
  try {
    const ref = doc(db, 'users', userId, 'mock_results', resultId);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getAllMockResults(userId: string): Promise<MockTestResult[]> {
  const path = `users/${userId}/mock_results`;
  try {
    const colRef = collection(db, 'users', userId, 'mock_results');
    const snap = await getDocs(colRef);
    const results: MockTestResult[] = [];
    snap.forEach((d) => {
      results.push(d.data() as MockTestResult);
    });
    // Sort recent first
    return results.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}
