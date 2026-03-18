import React from "react";

import type { ProfileFormData } from "../types";

type ProfileFormModalProps = {
  isOpen: boolean;
  formData: ProfileFormData;
  editingProfileId: string | null;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: keyof ProfileFormData, value: string) => void;
};

const inputClassName =
  "rounded-lg border border-(--color-border-strong) bg-(--color-surface-alt) px-3 py-2 outline-none transition placeholder:text-[var(--color-text-muted)] focus:ring-2 focus:ring-[var(--color-input-focus-ring)]";

export function ProfileFormModal({ isOpen, formData, editingProfileId, onClose, onSubmit, onFieldChange }: ProfileFormModalProps) {
  if (!isOpen) {
    return null;
  }

  const handleChange = (field: keyof ProfileFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange(field, event.target.value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--color-overlay) p-4" role="presentation" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-xl border border-(--color-border-strong) bg-(--color-surface) p-5 shadow-[0_18px_40px_var(--color-card-shadow)]"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-(--color-text-primary)">{editingProfileId ? "Edit Employee Card" : "Create Employee Card"}</h3>
        <p className="mt-1 text-sm text-(--color-text-secondary)">Fill in the fields below. Skills and expertise must be comma-separated.</p>

        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <label className="grid gap-1 text-sm text-(--color-text-secondary)">
            <span>Name *</span>
            <input className={inputClassName} value={formData.name} onChange={handleChange("name")} placeholder="Jane Doe" required />
          </label>

          <label className="grid gap-1 text-sm text-(--color-text-secondary)">
            <span>Title *</span>
            <input className={inputClassName} value={formData.title} onChange={handleChange("title")} placeholder="Frontend Engineer" required />
          </label>

          <label className="grid gap-1 text-sm text-(--color-text-secondary)">
            <span>Department *</span>
            <input className={inputClassName} value={formData.department} onChange={handleChange("department")} placeholder="Information Technology" required />
          </label>

          <label className="grid gap-1 text-sm text-(--color-text-secondary)">
            <span>Email *</span>
            <input
              type="email"
              className={inputClassName}
              value={formData.email}
              onChange={handleChange("email")}
              placeholder="jane.doe@contoso.com"
              required
            />
          </label>

          <label className="grid gap-1 text-sm text-(--color-text-secondary) md:col-span-2">
            <span>Skills * (comma-separated)</span>
            <input
              className={inputClassName}
              value={formData.skillsText}
              onChange={handleChange("skillsText")}
              placeholder="React, TypeScript, Teams"
              required
            />
          </label>

          <label className="grid gap-1 text-sm text-(--color-text-secondary) md:col-span-2">
            <span>Expertise (comma-separated)</span>
            <input
              className={inputClassName}
              value={formData.expertiseText}
              onChange={handleChange("expertiseText")}
              placeholder="Dashboard development, UI optimization"
            />
          </label>

          <div className="mt-1 flex justify-end gap-2 md:col-span-2">
            <button
              type="button"
              className="rounded-lg border border-(--color-border) bg-(--color-surface-alt) px-3 py-2 text-sm text-(--color-text-primary) hover:border-(--color-accent)"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-(--color-accent) px-3 py-2 text-sm font-medium text-(--color-accent-contrast) transition hover:bg-(--color-accent-strong)"
            >
              {editingProfileId ? "Save Changes" : "Create Card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
