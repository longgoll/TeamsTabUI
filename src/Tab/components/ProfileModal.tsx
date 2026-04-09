import type { EmployeeProfile } from "../types";

type ProfileModalProps = {
  profile: EmployeeProfile;
  onClose: () => void;
  onEdit: (profile: EmployeeProfile) => void;
  onDelete: (profile: EmployeeProfile) => void;
  onChat: (email: string) => void;
};

export function ProfileModal({ profile, onClose, onEdit, onDelete, onChat }: ProfileModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--color-overlay) p-4" role="presentation" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-xl border border-(--color-border-strong) bg-(--color-surface) p-5 shadow-[0_18px_40px_var(--color-card-shadow)]"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-(--color-text-primary)">Profile: {profile.name}</h3>

        <section className="mt-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">Basic Information</h4>
          <p className="mt-1 text-sm text-(--color-text-secondary)">
            {[profile.title, profile.department].filter(Boolean).join(" - ")}
          </p>
        </section>

        {(profile.expertise.length > 0 || profile.skills.length > 0) && (
          <section className="mt-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">Expertise and Skills</h4>
            {profile.expertise.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-(--color-text-primary)">
                {profile.expertise.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {profile.skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-(--color-border) bg-(--color-pill) px-2.5 py-1 text-xs text-(--color-pill-text)"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
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
            onClick={() => onDelete(profile)}
            type="button"
          >
            Delete Card
          </button>
          <button
            className="rounded-lg border border-(--color-border) bg-(--color-surface-alt) px-3 py-2 text-sm text-(--color-text-primary) hover:border-(--color-accent)"
            onClick={() => onEdit(profile)}
            type="button"
          >
            Edit Card
          </button>
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
