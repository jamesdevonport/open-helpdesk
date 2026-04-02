import { h } from "preact";

interface BubbleProps {
  color: string;
  unreadCount: number;
  onClick: () => void;
}

export function Bubble({ color, unreadCount, onClick }: BubbleProps) {
  return (
    <button class="uls-bubble" style={{ backgroundColor: color }} onClick={onClick}>
      <svg viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {unreadCount > 0 && (
        <span class="uls-bubble-badge">{unreadCount}</span>
      )}
    </button>
  );
}
