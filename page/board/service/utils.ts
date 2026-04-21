import type { RetroBoard } from "@/page/board/type";

export function syncTextareaHeight(element: HTMLTextAreaElement) {
  element.style.height = "0px";
  element.style.height = `${element.scrollHeight}px`;
}

export function buildBoardText(board: RetroBoard) {
  return board.sections
    .map((section) => {
      const lines = [section.title];

      if (section.cards.length === 0) {
        lines.push("  -");
      } else {
        section.cards.forEach((card, index) => {
          lines.push(` ${index + 1}. ${card.content}`);
        });
      }

      return lines.join("\n");
    })
    .join("\n\n");
}
