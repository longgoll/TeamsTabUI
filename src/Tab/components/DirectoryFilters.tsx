type DirectoryFiltersProps = {
  keyword: string;
  departmentFilter: string;
  titleFilter: string;
  skillFilter: string;
  departmentOptions: string[];
  titleOptions: string[];
  skillOptions: string[];
  onKeywordChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onSkillChange: (value: string) => void;
};

const inputClassName =
  "rounded-lg border border-(--color-border-strong) bg-(--color-surface-alt) px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:ring-2 focus:ring-[var(--color-input-focus-ring)]";

export function DirectoryFilters({
  keyword,
  departmentFilter,
  titleFilter,
  skillFilter,
  departmentOptions,
  titleOptions,
  skillOptions,
  onKeywordChange,
  onDepartmentChange,
  onTitleChange,
  onSkillChange,
}: DirectoryFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <input
        className={inputClassName}
        placeholder="Search by name or skill..."
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
      />

      <select className={inputClassName} value={departmentFilter} onChange={(event) => onDepartmentChange(event.target.value)}>
        {departmentOptions.map((department) => (
          <option key={department} value={department}>
            {department === "all" ? "All departments" : department}
          </option>
        ))}
      </select>

      <select className={inputClassName} value={titleFilter} onChange={(event) => onTitleChange(event.target.value)}>
        {titleOptions.map((title) => (
          <option key={title} value={title}>
            {title === "all" ? "All titles" : title}
          </option>
        ))}
      </select>

      <select className={inputClassName} value={skillFilter} onChange={(event) => onSkillChange(event.target.value)}>
        {skillOptions.map((skill) => (
          <option key={skill} value={skill}>
            {skill === "all" ? "All skills" : skill}
          </option>
        ))}
      </select>
    </div>
  );
}
