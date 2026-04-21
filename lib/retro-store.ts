import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db, firebaseEnabled } from "@/lib/firebase";

const retroCollectionId = "kilshot";
const configuredRetroDocId = process.env.NEXT_PUBLIC_RETRO_DOC_ID?.trim();

export type RetroCard = {
  id: string;
  content: string;
  createdAt: string;
};

export type RetroSection = {
  id: string;
  title: string;
  cards: RetroCard[];
};

export type RetroBoard = {
  sourceDocId?: string;
  sections: RetroSection[];
  updatedAt: string;
};

type FirestoreSection = {
  key?: string;
  contents?: string[];
};

type FirestoreRetroDocument = {
  good?: FirestoreSection;
  bad?: FirestoreSection;
  goal?: FirestoreSection;
  updatedAt?: string;
};

const sectionOrder = [
  { firestoreId: "good", id: "good", title: "잘한점" },
  { firestoreId: "bad", id: "bad", title: "부족한점" },
  { firestoreId: "goal", id: "goal", title: "노력한점" },
] as const;

export function createEmptyBoard(): RetroBoard {
  return {
    sections: sectionOrder.map((section) => ({
      id: section.id,
      title: section.title,
      cards: [],
    })),
    updatedAt: new Date().toISOString(),
  };
}

function ensureFirestore() {
  if (!firebaseEnabled || !db) {
    throw new Error("Firebase is not configured");
  }

  return db;
}

export async function loadBoard(): Promise<RetroBoard> {
  const firestore = ensureFirestore();
  let sourceDocId: string | undefined;
  let data: FirestoreRetroDocument | undefined;

  if (configuredRetroDocId) {
    const snapshot = await getDoc(doc(firestore, retroCollectionId, configuredRetroDocId));

    if (snapshot.exists()) {
      sourceDocId = snapshot.id;
      data = snapshot.data() as FirestoreRetroDocument | undefined;
      console.log("[retro-store] Firestore document loaded by configured id", {
        collection: retroCollectionId,
        docId: sourceDocId,
        data,
      });
    }
  } else {
    const snapshots = await getDocs(query(collection(firestore, retroCollectionId), limit(1)));

    if (!snapshots.empty) {
      const snapshot = snapshots.docs[0];
      sourceDocId = snapshot.id;
      data = snapshot.data() as FirestoreRetroDocument | undefined;
      console.log("[retro-store] Firestore document loaded by first document query", {
        collection: retroCollectionId,
        docId: sourceDocId,
        data,
      });
    }
  }

  if (!sourceDocId || !data) {
    return createEmptyBoard();
  }

  const board = {
    sourceDocId,
    sections:
      sectionOrder.map((section) => {
        const sectionData = data?.[section.firestoreId] as FirestoreSection | undefined;

        return {
          id: section.id,
          title: sectionData?.key ?? "",
          cards:
            sectionData?.contents?.map((content) => ({
              id: crypto.randomUUID(),
              content,
              createdAt: new Date().toISOString(),
            })) ?? [],
        };
      }) ?? createEmptyBoard().sections,
    updatedAt: data?.updatedAt ?? new Date().toISOString(),
  };

  console.log("[retro-store] Mapped board data", board);

  return board;
}

export async function saveBoard(board: RetroBoard) {
  const firestore = ensureFirestore();
  const docId = board.sourceDocId ?? configuredRetroDocId;

  if (!docId) {
    console.warn("[retro-store] Save skipped because no Firestore document id is configured.");
    return undefined;
  }

  const payload = toFirestoreDocument(board);

  console.log("[retro-store] Saving mapped Firestore payload", {
    collection: retroCollectionId,
    docId,
    payload,
  });

  await setDoc(doc(firestore, retroCollectionId, docId), payload, {
    merge: true,
  });

  return docId;
}

function toFirestoreDocument(board: RetroBoard) {
  return {
    good: toFirestoreSection(board.sections.find((section) => section.id === "good")),
    bad: toFirestoreSection(board.sections.find((section) => section.id === "bad")),
    goal: toFirestoreSection(board.sections.find((section) => section.id === "goal")),
    updatedAt: board.updatedAt,
    savedAt: serverTimestamp(),
  };
}

function toFirestoreSection(section: RetroSection | undefined) {
  return {
    key: section?.title ?? "",
    contents: section?.cards.map((card) => card.content) ?? [],
  };
}
