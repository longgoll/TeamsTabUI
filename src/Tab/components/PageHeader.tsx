type PageHeaderProps = {
  onCreate: () => void;
};

export function PageHeader({ onCreate }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl font-bold tracking-tight text-(--color-text-primary)">Employee Directory</h1>
      <button
        type="button"
        onClick={onCreate}
        className="rounded-lg bg-(--color-accent) px-4 py-2 text-sm font-semibold text-(--color-accent-contrast) transition hover:bg-(--color-accent-strong)"
      >
        Create Card
      </button>
    </div>
  );
}
