import type { EmployeeProfile } from "../types";
import { EmployeeCard } from "./EmployeeCard";

type EmployeeDirectoryGridProps = {
  profiles: EmployeeProfile[];
  onView: (profile: EmployeeProfile) => void;
  onChat: (email: string) => void;
  className?: string;
  isLoading?: boolean;
};

export function EmployeeDirectoryGrid({ profiles, onView, onChat, className = "", isLoading = false }: EmployeeDirectoryGridProps) {
  const containerClasses = ["grid gap-5 items-stretch", className].filter(Boolean).join(" ");

  return (
    <>
      <div className={containerClasses}>
        {isLoading
          ? Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-full min-h-96 w-full animate-pulse rounded-2xl border border-(--color-border) bg-(--color-surface-card) p-5 opacity-40 shadow-sm flex flex-col justify-between"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-2xl bg-(--color-border-strong)"></div>
                  <div className="h-5 w-3/4 rounded-full bg-(--color-border-strong) mt-2"></div>
                  <div className="h-3 w-1/2 rounded-full bg-(--color-border-strong)"></div>
                  <div className="h-3 w-1/3 rounded-full bg-(--color-border-strong)"></div>
                </div>
                <div className="mt-8 space-y-3">
                  <div className="h-4 w-full rounded-full bg-(--color-border-strong)"></div>
                  <div className="h-4 w-5/6 rounded-full bg-(--color-border-strong)"></div>
                </div>
                <div className="mt-6 flex grid-cols-2 gap-3">
                  <div className="h-10 w-full rounded-xl bg-(--color-border-strong)"></div>
                  <div className="h-10 w-full rounded-xl bg-(--color-border-strong)"></div>
                </div>
              </div>
            ))
          : profiles.map((person) => (
              <div key={person.id} className="h-full">
                <EmployeeCard profile={person} onView={onView} onChat={onChat} />
              </div>
            ))}
      </div>

      {!isLoading && profiles.length === 0 && (
        <p className="rounded-lg border border-dashed border-(--color-border-strong) bg-(--color-surface-alt) p-4 text-sm text-(--color-text-secondary)">
          No matching employees found for the current filters.
        </p>
      )}
    </>
  );
}
