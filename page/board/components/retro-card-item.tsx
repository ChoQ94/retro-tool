"use client";

import type { DragEvent } from "react";
import type { RetroCard } from "@/page/board/type";
import type { DropState, EditingState } from "@/page/board/type";

type RetroCardItemProps = {
  card: RetroCard;
  draggedCardId: string | null;
  dropTarget: DropState;
  editingCard: EditingState;
  sectionId: string;
  onBeginCardEdit: (sectionId: string, card: RetroCard) => void;
  onUpdateEditingContent: (content: string) => void;
  onCommitCardEdit: () => void;
  onCancelCardEdit: () => void;
  onRemoveCard: (sectionId: string, cardId: string) => void;
  onCardDragStart: (sectionId: string, cardId: string) => void;
  onCardDragEnd: () => void;
  onCardDragOver: (event: DragEvent<HTMLDivElement>, sectionId: string, cardId: string) => void;
  onCardDrop: (targetSectionId: string, targetCardId: string | null, placement: "before" | "after") => void;
  syncTextareaHeight: (element: HTMLTextAreaElement) => void;
};

export function RetroCardItem({
  card,
  draggedCardId,
  dropTarget,
  editingCard,
  sectionId,
  onBeginCardEdit,
  onUpdateEditingContent,
  onCommitCardEdit,
  onCancelCardEdit,
  onRemoveCard,
  onCardDragStart,
  onCardDragEnd,
  onCardDragOver,
  onCardDrop,
  syncTextareaHeight,
}: RetroCardItemProps) {
  const isEditing = editingCard?.cardId === card.id;
  const isDropTarget = dropTarget?.sectionId === sectionId && dropTarget.cardId === card.id;
  const dropPlacement = isDropTarget ? dropTarget.placement : "before";

  const handleBeginEdit = () => {
    onBeginCardEdit(sectionId, card);
  };

  const handleRemove = () => {
    onRemoveCard(sectionId, card.id);
  };

  const handleDragStartLocal = () => {
    onCardDragStart(sectionId, card.id);
  };

  const handleDragOverLocal = (event: DragEvent<HTMLDivElement>) => {
    onCardDragOver(event, sectionId, card.id);
  };

  const handleDropLocal = () => {
    onCardDrop(sectionId, card.id, dropPlacement);
  };

  return (
    <div
      className={`card ${isDropTarget ? "card--drop-target" : ""} ${
        isDropTarget && dropPlacement === "after" ? "card--drop-after" : "card--drop-before"
      } ${draggedCardId === card.id ? "card--dragging" : ""}`}
      draggable={!isEditing}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        handleDragStartLocal();
      }}
      onDragEnd={onCardDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        handleDragOverLocal(event);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        handleDropLocal();
      }}
    >
      {isEditing ? (
        <textarea
          ref={(element) => {
            if (element) {
              syncTextareaHeight(element);
            }
          }}
          value={editingCard.content}
          onChange={(event) => {
            syncTextareaHeight(event.target);
            onUpdateEditingContent(event.target.value);
          }}
        />
      ) : (
        <p className="card__content">{card.content}</p>
      )}

      <div className="card__footer">
        <div className="card__actions">
          {isEditing ? (
            <>
              <button className="card__action" onClick={onCommitCardEdit} type="button">
                저장
              </button>
              <button className="card__action" onClick={onCancelCardEdit} type="button">
                취소
              </button>
            </>
          ) : (
            <button className="card__action" onClick={handleBeginEdit} type="button">
              수정
            </button>
          )}
          <button className="card__delete" onClick={handleRemove} type="button">
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
