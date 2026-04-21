"use client";

import type { DragEvent } from "react";
import { RetroCardItem } from "@/page/board/components/retro-card-item";
import type { DropState, EditingState, RetroCard, RetroSection } from "@/page/board/type";

type BoardColumnProps = {
  draftValue: string;
  draggedCardId: string | null;
  dropTarget: DropState;
  editingCard: EditingState;
  isDropAtEnd: boolean;
  section: RetroSection;
  onAddCard: (sectionId: string) => void;
  onBeginCardEdit: (sectionId: string, card: RetroCard) => void;
  onCancelCardEdit: () => void;
  onCardDragEnd: () => void;
  onCardDragOver: (event: DragEvent<HTMLDivElement>, sectionId: string, cardId: string) => void;
  onCardDragStart: (sectionId: string, cardId: string) => void;
  onCardDrop: (targetSectionId: string, targetCardId: string | null, placement: "before" | "after") => void;
  onChangeDraft: (sectionId: string, value: string) => void;
  onChangeTitle: (sectionId: string, value: string) => void;
  onColumnDragOver: (sectionId: string) => void;
  onCommitCardEdit: () => void;
  onCommitTitle: (sectionId: string, value: string) => void;
  onRemoveCard: (sectionId: string, cardId: string) => void;
  onUpdateEditingContent: (content: string) => void;
  syncTextareaHeight: (element: HTMLTextAreaElement) => void;
};

export function BoardColumn({
  draftValue,
  draggedCardId,
  dropTarget,
  editingCard,
  isDropAtEnd,
  section,
  onAddCard,
  onBeginCardEdit,
  onCancelCardEdit,
  onCardDragEnd,
  onCardDragOver,
  onCardDragStart,
  onCardDrop,
  onChangeDraft,
  onChangeTitle,
  onColumnDragOver,
  onCommitCardEdit,
  onCommitTitle,
  onRemoveCard,
  onUpdateEditingContent,
  syncTextareaHeight,
}: BoardColumnProps) {
  const handleChangeTitle = (value: string) => {
    onChangeTitle(section.id, value);
  };

  const handleCommitTitle = (value: string) => {
    onCommitTitle(section.id, value);
  };

  const handleChangeDraft = (value: string) => {
    onChangeDraft(section.id, value);
  };

  const handleAddCard = () => {
    onAddCard(section.id);
  };

  const handleColumnDragOverLocal = () => {
    onColumnDragOver(section.id);
  };

  const handleDropAtEnd = () => {
    onCardDrop(section.id, null, "after");
  };

  return (
    <article className={`column column--${section.id}`}>
      <header className="column__header">
        <input
          className="column__title"
          value={section.title}
          onChange={(event) => handleChangeTitle(event.target.value)}
          onBlur={(event) => handleCommitTitle(event.target.value)}
        />
      </header>

      <div className="composer">
        <textarea
          placeholder={`${section.title}에 추가할 내용을 입력하세요`}
          value={draftValue}
          onChange={(event) => handleChangeDraft(event.target.value)}
        />
        <div className="composer__actions">
          <button className="button button--primary button--compact" onClick={handleAddCard}>
            추가
          </button>
        </div>
      </div>

      <div
        className={`cards ${isDropAtEnd ? "cards--drop-end" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          handleColumnDragOverLocal();
        }}
        onDrop={(event) => {
          event.preventDefault();
          handleDropAtEnd();
        }}
      >
        {section.cards.map((card) => (
          <RetroCardItem
            key={card.id}
            card={card}
            draggedCardId={draggedCardId}
            dropTarget={dropTarget}
            editingCard={editingCard}
            sectionId={section.id}
            onBeginCardEdit={onBeginCardEdit}
            onUpdateEditingContent={onUpdateEditingContent}
            onCommitCardEdit={onCommitCardEdit}
            onCancelCardEdit={onCancelCardEdit}
            onRemoveCard={onRemoveCard}
            onCardDragStart={onCardDragStart}
            onCardDragEnd={onCardDragEnd}
            onCardDragOver={onCardDragOver}
            onCardDrop={onCardDrop}
            syncTextareaHeight={syncTextareaHeight}
          />
        ))}

        <div
          className={`cards__dropzone ${isDropAtEnd ? "cards__dropzone--active" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            event.stopPropagation();
            handleColumnDragOverLocal();
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            handleDropAtEnd();
          }}
        />
      </div>
    </article>
  );
}
