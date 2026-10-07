import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TermsAndConditions, TermsAcceptance } from '../types';

export const DEFAULT_TERMS_CONTENT = `# Innolink Technologies — Platform Terms & Conditions

**Effective Date:** October 2026 | **Version:** 1

Welcome to Innolink Technologies. These Terms & Conditions govern your access to and use of our educational learning platform, hardware laboratories, and online STEM marketplace.

### 1. Educational Services & Platform Access
1. Innolink Technologies provides access to structured engineering courses, hands-on electronic simulation environments, and mentor-evaluated laboratory assessments.
2. Enrollment in courses requires formal registration and mentor authorization. Creating an account does not automatically grant course content access.
3. Access credentials and cryptographic course keys are personal, non-transferable, and subject to revocation upon unauthorized redistribution.

### 2. Coding & Hardware Lab Safety
1. Students utilizing the remote hardware test bench and embedded device simulators agree to operate virtual equipment within specified voltage and current tolerances.
2. Automated circuit tests must not be subjected to deliberate exploitation, denial-of-service scripts, or excessive rate abuse.

### 3. Course Pricing, Currency & Payments
1. All course fees and hardware kit pricing are quoted and processed in **Indian Rupees (₹ INR)**.
2. Verified transactions processed through Razorpay or authorized banking gateways are final upon access key issuance.
3. Applicable promotional coupons must be redeemed prior to checkout finalization.

### 4. Intellectual Property & Course Materials
1. All video lectures, schematic diagrams, source code templates, and assessment materials are the proprietary property of Innolink Technologies and its faculty.
2. Unauthorized recording, commercial reproduction, or public broadcasting of course materials is strictly prohibited.

### 5. Account Termination & Revisions
1. Innolink Technologies reserves the right to modify these Terms. Updates will be published with an updated version number. Continued access requires acceptance of the active version.`;

/**
 * Fetch current Terms & Conditions from Firestore (or fallback API)
 */
export async function getTermsAndConditions(): Promise<TermsAndConditions> {
  try {
    const termsDocRef = doc(db, 'platformSettings', 'termsAndConditions');
    const snap = await getDoc(termsDocRef);
    if (snap.exists()) {
      const data = snap.data() as TermsAndConditions;
      return {
        id: snap.id,
        content: data.content || DEFAULT_TERMS_CONTENT,
        version: data.version || 1,
        published: data.published ?? true,
        updatedAt: data.updatedAt || new Date().toISOString(),
        updatedBy: data.updatedBy || 'Platform Owner',
        publishedAt: data.publishedAt || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('Firestore terms fetch notice, using fallback:', err);
  }

  // Fallback to backend endpoint
  try {
    const res = await fetch('/api/platform/terms');
    if (res.ok) {
      const data = await res.json();
      return {
        content: data.content || DEFAULT_TERMS_CONTENT,
        version: data.version || 1,
        published: data.published ?? true,
        updatedAt: data.updatedAt || new Date().toISOString(),
        updatedBy: data.updatedBy || 'Platform Owner',
        publishedAt: data.publishedAt || new Date().toISOString(),
      };
    }
  } catch (e) {
    // ignore
  }

  return {
    content: DEFAULT_TERMS_CONTENT,
    version: 1,
    published: true,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Platform Owner',
    publishedAt: new Date().toISOString(),
  };
}

/**
 * Save or publish Terms & Conditions by the Owner
 */
export async function saveTermsAndConditions(
  content: string,
  publish: boolean,
  currentVersion: number,
  authorName = 'Platform Owner'
): Promise<TermsAndConditions> {
  const now = new Date().toISOString();
  // When publishing a change, increment version
  const newVersion = publish ? currentVersion + 1 : currentVersion;

  const updated: TermsAndConditions = {
    content,
    version: newVersion,
    published: publish,
    updatedAt: now,
    updatedBy: authorName,
    publishedAt: publish ? now : undefined,
  };

  try {
    const termsDocRef = doc(db, 'platformSettings', 'termsAndConditions');
    await setDoc(termsDocRef, updated, { merge: true });
  } catch (err) {
    console.warn('Firestore terms save notice:', err);
  }

  // Also sync to backend API
  try {
    await fetch('/api/platform/terms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
  } catch (e) {
    // ignore
  }

  return updated;
}

/**
 * Check if an authenticated student has accepted the current terms version
 */
export async function checkStudentTermsAcceptance(
  studentUid: string,
  requiredVersion: number
): Promise<{ accepted: boolean; acceptedVersion: number }> {
  if (!studentUid) return { accepted: true, acceptedVersion: requiredVersion };

  try {
    const accRef = doc(db, 'termsAcceptances', studentUid);
    const snap = await getDoc(accRef);
    if (snap.exists()) {
      const data = snap.data() as TermsAcceptance;
      const acceptedVersion = Number(data.termsVersion) || 0;
      return {
        accepted: acceptedVersion >= requiredVersion,
        acceptedVersion,
      };
    }
  } catch (err) {
    console.warn('Check terms acceptance notice:', err);
  }

  // Check localStorage cache as secondary check
  try {
    const local = localStorage.getItem(`innolink_terms_acc_${studentUid}`);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.termsVersion >= requiredVersion) {
        return { accepted: true, acceptedVersion: parsed.termsVersion };
      }
    }
  } catch (e) {
    // ignore
  }

  return { accepted: false, acceptedVersion: 0 };
}

/**
 * Record a student's acceptance of the current terms version
 */
export async function recordStudentTermsAcceptance(
  studentUid: string,
  termsVersion: number
): Promise<boolean> {
  if (!studentUid) return false;

  const now = new Date().toISOString();
  const record: TermsAcceptance = {
    userId: studentUid,
    termsVersion,
    acceptedAt: now,
  };

  try {
    const accRef = doc(db, 'termsAcceptances', studentUid);
    await setDoc(accRef, record, { merge: true });
  } catch (err) {
    console.warn('Save terms acceptance firestore notice:', err);
  }

  try {
    localStorage.setItem(`innolink_terms_acc_${studentUid}`, JSON.stringify(record));
  } catch (e) {
    // ignore
  }

  return true;
}
