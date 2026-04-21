"use client";

import type { DragEvent } from "react";
import { useEffect, useState, useTransition } from "react";
import { AccessGate } from "@/page/board/components/access-gate";
import { BoardColumn } from "@/page/board/components/board-column";
import { DownloadButton } from "@/page/board/components/download-button";
import { createEmptyBoard, loadBoard, saveBoard } from "@/page/board/service/retro-store";
import { buildBoardText, syncTextareaHeight } from "@/page/board/service/utils";
import type { DraftMap, DragState, DropState, EditingState, RetroBoard, RetroCard } from "@/page/board/type";

const accessPassword = process.env.NEXT_PUBLIC_ACCESS_PASSWORD?.trim();
const accessSessionKey = "retro-access-granted";

export default function BoardPage() {
  const [board, setBoard] = useState<RetroBoard>(createEmptyBoard());
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAccessChecked, setIsAccessChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [editingCard, setEditingCard] = useState<EditingState>(null);
  const [draggedCard, setDraggedCard] = useState<DragState>(null);
  const [dropTarget, setDropTarget] = useState<DropState>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!accessPassword) {
      setIsAuthorized(true);
      setIsAccessChecked(true);
      return;
    }

    const granted = window.sessionStorage.getItem(accessSessionKey) === "true";
    setIsAuthorized(granted);
    setIsAccessChecked(true);
  }, []);

  useEffect(() => {
    if (!isAccessChecked || !isAuthorized) {
      return;
    }

    let active = true;

    startTransition(() => {
      loadBoard()
        .then((loadedBoard) => {
          if (!active) {
            return;
          }

          setBoard(loadedBoard);
          setIsLoaded(true);
        })
        .catch((error) => {
          if (!active) {
            return;
          }

          console.error("Failed to load retrospective board from Firestore.", error);
          setIsLoaded(true);
        });
    });

    return () => {
      active = false;
    };
  }, [isAccessChecked, isAuthorized]);

  const persist = (nextBoard: RetroBoard) => {
    setBoard(nextBoard);

    startTransition(() => {
      saveBoard(nextBoard)
        .then((sourceDocId) => {
          if (!sourceDocId) {
            return;
          }

          setBoard((current) => ({
            ...current,
            sourceDocId,
          }));
        })
        .catch((error) => {
          console.error("Failed to save retrospective board to Firestore.", error);
        });
    });
  };

  const updateSectionTitle = (sectionId: string, title: string) => {
    setBoard({
      ...board,
      sections: board.sections.map((section) =>
        section.id === sectionId ? { ...section, title } : section,
      ),
      updatedAt: new Date().toISOString(),
    });
  };

  const commitSectionTitle = (sectionId: string, title: string) => {
    const currentSection = board.sections.find((section) => section.id === sectionId);
    const nextTitle = title.trim() || currentSection?.title.trim() || "이름 없는 섹션";

    persist({
      ...board,
      sections: board.sections.map((section) =>
        section.id === sectionId ? { ...section, title: nextTitle } : section,
      ),
      updatedAt: new Date().toISOString(),
    });
  };

  const updateCardDraft = (sectionId: string, value: string) => {
    setDrafts((current) => ({
      ...current,
      [sectionId]: value,
    }));
  };

  const addCard = (sectionId: string) => {
    const content = drafts[sectionId]?.trim();
    if (!content) {
      return;
    }

    const nextBoard = {
      ...board,
      sections: board.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              cards: [
                {
                  id: crypto.randomUUID(),
                  content,
                  createdAt: new Date().toISOString(),
                },
                ...section.cards,
              ],
            }
          : section,
      ),
      updatedAt: new Date().toISOString(),
    };

    setDrafts((current) => ({
      ...current,
      [sectionId]: "",
    }));

    persist(nextBoard);
  };

  const beginCardEdit = (sectionId: string, card: RetroCard) => {
    setEditingCard({
      sectionId,
      cardId: card.id,
      content: card.content,
    });
  };

  const updateEditingContent = (content: string) => {
    setEditingCard((current) => (current ? { ...current, content } : current));
  };

  const cancelCardEdit = () => {
    setEditingCard(null);
  };

  const removeCard = (sectionId: string, cardId: string) => {
    persist({
      ...board,
      sections: board.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              cards: section.cards.filter((card) => card.id !== cardId),
            }
          : section,
      ),
      updatedAt: new Date().toISOString(),
    });
  };

  const commitCardEdit = () => {
    if (!editingCard) {
      return;
    }

    const { sectionId, cardId, content } = editingCard;
    const trimmed = content.trim();

    if (!trimmed) {
      removeCard(sectionId, cardId);
      setEditingCard(null);
      return;
    }

    persist({
      ...board,
      sections: board.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              cards: section.cards.map((card) =>
                card.id === cardId ? { ...card, content: trimmed } : card,
              ),
            }
          : section,
      ),
      updatedAt: new Date().toISOString(),
    });

    setEditingCard(null);
  };

  const handleDragStart = (sectionId: string, cardId: string) => {
    if (editingCard?.cardId === cardId) {
      return;
    }

    setDraggedCard({ sectionId, cardId });
    setDropTarget({ sectionId, cardId, placement: "before" });
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
    setDropTarget(null);
  };

  const handleCardDragOver = (
    event: DragEvent<HTMLDivElement>,
    sectionId: string,
    cardId: string,
  ) => {
    if (!draggedCard) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const placement = event.clientY - bounds.top < bounds.height / 2 ? "before" : "after";
    setDropTarget({ sectionId, cardId, placement });
  };

  const handleColumnDragOver = (sectionId: string) => {
    if (!draggedCard) {
      return;
    }

    setDropTarget({ sectionId, cardId: null, placement: "after" });
  };

  const moveDraggedCard = (
    targetSectionId: string,
    targetCardId: string | null,
    placement: "before" | "after",
  ) => {
    if (!draggedCard) {
      return;
    }

    if (
      draggedCard.sectionId === targetSectionId &&
      draggedCard.cardId === targetCardId &&
      placement === "before"
    ) {
      handleDragEnd();
      return;
    }

    const sourceSection = board.sections.find((section) => section.id === draggedCard.sectionId);
    const movedCard = sourceSection?.cards.find((card) => card.id === draggedCard.cardId);

    if (!sourceSection || !movedCard) {
      handleDragEnd();
      return;
    }

    const nextSections = board.sections.map((section) =>
      section.id === draggedCard.sectionId
        ? {
            ...section,
            cards: section.cards.filter((card) => card.id !== draggedCard.cardId),
          }
        : section,
    );

    const finalSections = nextSections.map((section) => {
      if (section.id !== targetSectionId) {
        return section;
      }

      const nextCards = [...section.cards];
      const baseIndex =
        targetCardId === null
          ? nextCards.length
          : nextCards.findIndex((card) => card.id === targetCardId);

      if (baseIndex === -1) {
        nextCards.push(movedCard);
      } else {
        const insertIndex = placement === "after" ? baseIndex + 1 : baseIndex;
        nextCards.splice(insertIndex, 0, movedCard);
      }

      return {
        ...section,
        cards: nextCards,
      };
    });

    persist({
      ...board,
      sections: finalSections,
      updatedAt: new Date().toISOString(),
    });

    handleDragEnd();
  };

  const submitPassword = () => {
    if (!accessPassword) {
      setIsAuthorized(true);
      setIsAccessChecked(true);
      return;
    }

    if (passwordInput === accessPassword) {
      window.sessionStorage.setItem(accessSessionKey, "true");
      setIsAuthorized(true);
      setPasswordError("");
      return;
    }

    setPasswordError("비밀번호가 맞지 않습니다.");
  };

  const downloadBoard = () => {
    const content = buildBoardText(board);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `retro-${date}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isAccessChecked) {
    return <main className="page-shell" />;
  }

  if (!isAuthorized) {
    return (
      <AccessGate
        error={passwordError}
        password={passwordInput}
        onChangePassword={(value) => {
          setPasswordInput(value);
          if (passwordError) {
            setPasswordError("");
          }
        }}
        onSubmit={submitPassword}
      />
    );
  }

  if (!isLoaded) {
    return <main className="page-shell" />;
  }

  return (
    <main className="page-shell">
      <section className="board-grid">
        {board.sections.map((section) => (
          <BoardColumn
            key={section.id}
            section={section}
            draftValue={drafts[section.id] ?? ""}
            isDropAtEnd={dropTarget?.sectionId === section.id && dropTarget.cardId === null}
            editingCard={editingCard}
            draggedCardId={draggedCard?.cardId ?? null}
            dropTarget={dropTarget}
            onChangeTitle={updateSectionTitle}
            onCommitTitle={commitSectionTitle}
            onChangeDraft={updateCardDraft}
            onAddCard={addCard}
            onBeginCardEdit={beginCardEdit}
            onUpdateEditingContent={updateEditingContent}
            onCommitCardEdit={commitCardEdit}
            onCancelCardEdit={cancelCardEdit}
            onRemoveCard={removeCard}
            onCardDragStart={handleDragStart}
            onCardDragEnd={handleDragEnd}
            onCardDragOver={handleCardDragOver}
            onColumnDragOver={handleColumnDragOver}
            onCardDrop={moveDraggedCard}
            syncTextareaHeight={syncTextareaHeight}
          />
        ))}
      </section>
      <DownloadButton onClick={downloadBoard} />
    </main>
  );
}
