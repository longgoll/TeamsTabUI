import React from "react";

import type { EmployeeProfile } from "../types";

type EmployeeCardProps = {
  profile: EmployeeProfile;
  onView: (profile: EmployeeProfile) => void;
  onEdit: (profile: EmployeeProfile) => void;
  onDelete: (profile: EmployeeProfile) => void;
  onChat: (email: string) => void;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

export function EmployeeCard({ profile, onView, onEdit, onDelete, onChat }: EmployeeCardProps) {
  const initials = React.useMemo(() => getInitials(profile.name), [profile.name]);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const handleView = React.useCallback(() => onView(profile), [onView, profile]);
  const handleEdit = React.useCallback(() => onEdit(profile), [onEdit, profile]);
  const handleDelete = React.useCallback(() => onDelete(profile), [onDelete, profile]);
  const handleChat = React.useCallback(() => onChat(profile.email), [onChat, profile.email]);
  const focusAreas = React.useMemo(
    () => (profile.expertise.length ? profile.expertise.slice(0, 3).join(" | ") : "Always learning"),
    [profile.expertise]
  );
  const visibleSkills = React.useMemo(() => profile.skills.slice(0, 5), [profile.skills]);
  const extraSkills = profile.skills.length - visibleSkills.length;

  React.useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  return (
    <article
      className="group relative flex h-full w-full min-h-96 flex-col rounded-2xl border border-(--color-border) bg-(--color-surface-card) p-5 text-(--color-text-primary) shadow-[0_16px_30px_var(--color-card-shadow)] transition duration-300 hover:-translate-y-1 hover:border-(--color-accent)"
    >
      <div className="absolute right-5 top-5" ref={menuRef}>
        <button
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          aria-label="Open card actions"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-(--color-border-strong) bg-(--color-surface-alt) text-lg font-semibold leading-none text-(--color-text-secondary) transition hover:border-(--color-accent) hover:text-(--color-accent)"
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          ⋯
        </button>

        {isMenuOpen && (
          <div
            className="absolute right-0 top-11 z-10 min-w-36 rounded-xl border border-(--color-border-strong) bg-(--color-surface) p-1 shadow-[0_12px_24px_var(--color-card-shadow)]"
            role="menu"
          >
            <button
              className="flex w-full items-center justify-start rounded-lg px-3 py-2 text-sm font-medium text-(--color-text-primary) transition hover:bg-(--color-surface-alt)"
              type="button"
              role="menuitem"
              onClick={() => {
                handleEdit();
                setIsMenuOpen(false);
              }}
            >
              Update
            </button>
            <button
              className="flex w-full items-center justify-start rounded-lg px-3 py-2 text-sm font-medium text-(--color-text-primary) transition hover:bg-(--color-surface-alt)"
              type="button"
              role="menuitem"
              onClick={() => {
                handleDelete();
                setIsMenuOpen(false);
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <header className="flex flex-col items-center gap-3 text-center">
        <button
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-(--color-accent) text-lg font-bold uppercase text-(--color-accent-contrast) shadow-[0_12px_24px_var(--color-card-shadow)]"
          type="button"
          onClick={handleView}
        >
          {initials}
        </button>

        <div className="space-y-1">
          <p className="text-xl font-semibold tracking-tight">{profile.name}</p>
          <p className="text-sm text-(--color-text-secondary)">{profile.title}</p>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-(--color-accent)">{profile.department}</p>
        </div>
      </header>

      <section className="mt-4 flex flex-1 flex-col gap-4 text-center text-sm text-(--color-text-secondary)">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-(--color-text-muted)">Focus</p>
          <p className="text-base text-(--color-text-primary)">{focusAreas}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {visibleSkills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-(--color-border) bg-(--color-pill) px-3 py-1 text-xs font-medium text-(--color-pill-text)"
            >
              {skill}
            </span>
          ))}
          {extraSkills > 0 && (
            <span className="rounded-full border border-dashed border-(--color-border-strong) bg-transparent px-3 py-1 text-xs font-semibold text-(--color-text-secondary)">
              +{extraSkills} more
            </span>
          )}
        </div>
      </section>

      <footer className="grid grid-cols-2 gap-3 pt-5">
        <button
          className="rounded-xl border border-(--color-border) bg-(--color-surface-alt) px-3 py-2 text-sm font-semibold text-(--color-text-primary) transition hover:border-(--color-accent)"
          type="button"
          onClick={handleView}
        >
          View
        </button>
        <button
          className="rounded-xl bg-(--color-accent) px-3 py-2 text-sm font-semibold text-(--color-accent-contrast) transition hover:bg-(--color-accent-strong)"
          type="button"
          onClick={handleChat}
        >
          Chat
        </button>
      </footer>
    </article>
  );
}
