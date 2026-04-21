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

export type DraftMap = Record<string, string>;

export type EditingState = {
  sectionId: string;
  cardId: string;
  content: string;
} | null;

export type DragState = {
  sectionId: string;
  cardId: string;
} | null;

export type DropState = {
  sectionId: string;
  cardId: string | null;
  placement: "before" | "after";
} | null;
