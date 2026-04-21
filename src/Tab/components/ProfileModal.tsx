import type { EmployeeProfile } from "../types";

type ProfileModalProps = {
  profile: EmployeeProfile;
  onClose: () => void;
  onChat: (email: string) => void;
};

const getPresenceColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "available": return "#92c353";
    case "busy":
    case "donotdisturb":
    case "in a meeting": return "#c4314b";
    case "away":
    case "berightback": return "#ffaa44";
    default: return "#8a8886";
  }
};

export function ProfileModal({ profile, onClose, onChat }: ProfileModalProps) {
  const getInitials = (name: string) => name.split(" ").filter(Boolean).slice(-2).map((w) => w[0]?.toUpperCase() ?? "").join("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--color-overlay) p-4" role="presentation" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-xl border border-(--color-border-strong) bg-(--color-surface) p-6 shadow-[0_18px_40px_var(--color-card-shadow)]"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-5">
          <div className="relative shrink-0">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl overflow-hidden bg-(--color-accent) text-3xl font-bold uppercase text-(--color-accent-contrast) shadow-[0_12px_24px_var(--color-card-shadow)]">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
              ) : (
                getInitials(profile.name)
              )}
            </div>
            <div 
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-(--color-surface)"
              style={{ backgroundColor: getPresenceColor(profile.presence) }}
              title={profile.presence || "Offline"}
            />
          </div>

          <div className="flex-1 mt-1">
            <h3 className="text-2xl font-bold text-(--color-text-primary)">{profile.name}</h3>
            <p className="mt-1 text-sm font-medium text-(--color-text-secondary)">
              {[profile.title, profile.department].filter(Boolean).join(" - ")}
            </p>
            {profile.location && (
              <p className="text-xs mt-1 font-medium uppercase tracking-[0.2em] text-(--color-text-muted)">
                📍 {profile.location}
              </p>
            )}
            {profile.rawStatus && (
              <div 
                className="mt-3 text-sm text-(--color-text-primary) border-l-2 border-(--color-border) pl-3 italic opacity-90"
                dangerouslySetInnerHTML={{ __html: profile.rawStatus }} 
              />
            )}
          </div>
        </div>

        {profile.expertise.length > 0 && (
          <section className="mt-5 border-t border-(--color-border) pt-4">
            <h4 className="text-sm font-semibold uppercase tracking-widest text-(--color-accent)">🎯 Expertise</h4>
            <div className="mt-2 flex flex-col gap-1.5 text-sm font-medium text-(--color-text-primary)">
              {profile.expertise.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-(--color-accent) rounded-full"></span>
                  {item}
                </div>
              ))}
            </div>
          </section>
        )}

        {profile.skills.length > 0 && (
          <section className="mt-5 border-t border-(--color-border) pt-4">
            <h4 className="text-sm font-semibold uppercase tracking-widest text-(--color-text-muted)">💻 Technical Skills</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-(--color-border-strong) bg-(--color-surface-alt) px-3 py-1.5 text-xs font-semibold text-(--color-text-primary) shadow-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="mt-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">Quick Collaboration</h4>
          <p className="mt-1 text-sm text-(--color-text-secondary)">
            Search by department, title, or skills, then start a direct chat in one click.
          </p>
          <button
            className="mt-3 rounded-lg bg-(--color-accent) px-3 py-2 text-sm font-medium text-(--color-accent-contrast) transition hover:bg-(--color-accent-strong)"
            onClick={() => onChat(profile.email)}
            type="button"
          >
            Chat with {profile.name}
          </button>
        </section>

        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-lg border border-(--color-border) bg-(--color-surface-alt) px-3 py-2 text-sm text-(--color-text-primary) hover:border-(--color-accent)"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
