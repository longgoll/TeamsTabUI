import type { EmployeeProfile } from "../types";
import { EmployeeCard } from "./EmployeeCard";

type EmployeeDirectoryGridProps = {
  profiles: EmployeeProfile[];
  onView: (profile: EmployeeProfile) => void;
  onEdit: (profile: EmployeeProfile) => void;
  onDelete: (profile: EmployeeProfile) => void;
  onChat: (email: string) => void;
  className?: string;
};

export function EmployeeDirectoryGrid({ profiles, onView, onEdit, onDelete, onChat, className = "" }: EmployeeDirectoryGridProps) {
  const containerClasses = ["grid gap-5 items-stretch", className].filter(Boolean).join(" ");

  return (
    <>
      <div className={containerClasses}>
        {profiles.map((person) => (
          <div key={person.id} className="h-full">
            <EmployeeCard profile={person} onView={onView} onEdit={onEdit} onDelete={onDelete} onChat={onChat} />
          </div>
        ))}
      </div>

      {profiles.length === 0 && (
        <p className="rounded-lg border border-dashed border-(--color-border-strong) bg-(--color-surface-alt) p-4 text-sm text-(--color-text-secondary)">
          No matching employees found for the current filters.
        </p>
      )}
    </>
  );
}
