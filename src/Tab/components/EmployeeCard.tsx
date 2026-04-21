import React from "react";

import type { EmployeeProfile } from "../types";

type EmployeeCardProps = {
  profile: EmployeeProfile;
  onView: (profile: EmployeeProfile) => void;
  onChat: (email: string) => void;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

const getPresenceColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "available": return "#92c353"; // Teams Green
    case "busy":
    case "donotdisturb":
    case "in a meeting": return "#c4314b"; // Teams Red
    case "away":
    case "berightback": return "#ffaa44"; // Teams Yellow
    default: return "#8a8886"; // Offline / Unknown
  }
};

export function EmployeeCard({ profile, onView, onChat }: EmployeeCardProps) {
  const initials = React.useMemo(() => getInitials(profile.name), [profile.name]);
  const handleView = React.useCallback(() => onView(profile), [onView, profile]);
  const handleChat = React.useCallback(() => onChat(profile.email), [onChat, profile.email]);
  const visibleSkills = React.useMemo(() => profile.skills.slice(0, 5), [profile.skills]);
  const extraSkills = profile.skills.length - visibleSkills.length;

  return (
    <article
      className="group relative flex h-full w-full min-h-96 flex-col rounded-2xl border border-(--color-border) bg-(--color-surface-card) p-5 text-(--color-text-primary) shadow-[0_16px_30px_var(--color-card-shadow)] transition duration-300 hover:-translate-y-1 hover:border-(--color-accent)"
      style={{ animation: 'fade-in-up 0.5s ease-out forwards' }}
    >
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="relative">
          <button
            className="flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden bg-(--color-accent) text-lg font-bold uppercase text-(--color-accent-contrast) shadow-[0_12px_24px_var(--color-card-shadow)] hover:opacity-90 transition"
            type="button"
            onClick={handleView}
          >
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </button>
          {/* Presence Indicator */}
          <div 
            className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-(--color-surface-card)"
            style={{ backgroundColor: getPresenceColor(profile.presence) }}
            title={profile.presence || "Offline"}
          />
        </div>

        <div className="space-y-1">
          {profile.name && <p className="text-xl font-semibold tracking-tight">{profile.name}</p>}
          {profile.title && <p className="text-sm text-(--color-text-secondary)">{profile.title}</p>}
          {(profile.department || profile.location) && (
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-(--color-accent)">
              {[profile.department, profile.location].filter(Boolean).join(" • ")}
            </p>
          )}
        </div>
      </header>

      {(profile.expertise.length > 0 || profile.skills.length > 0) && (
        <section className="mt-4 border-t border-(--color-border) pt-4 flex flex-1 flex-col gap-4 text-center text-sm text-(--color-text-secondary)">
          {profile.expertise.length > 0 && (
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-(--color-accent) mb-2">🎯 Expertise</p>
              <div className="flex flex-wrap justify-center gap-1">
                {profile.expertise.map((exp) => (
                  <span key={exp} className="text-xs font-semibold text-(--color-text-primary)">
                    {exp} {exp !== profile.expertise[profile.expertise.length - 1] && <span className="text-(--color-border-strong) mx-1">|</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.skills.length > 0 && (
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-(--color-text-muted) mb-2">💻 Technical Skills</p>
              <div className="flex flex-wrap justify-center gap-2">
                {visibleSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-(--color-border-strong) bg-(--color-surface) px-3 py-1 text-xs font-medium text-(--color-text-primary) shadow-sm"
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
            </div>
          )}
        </section>
      )}

      <footer className="mt-auto grid grid-cols-2 gap-3 pt-5">
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
