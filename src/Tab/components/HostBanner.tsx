type HostBannerProps = {
  content: string;
};

export function HostBanner({ content }: HostBannerProps) {
  if (!content) {
    return null;
  }

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-3 text-sm text-(--color-text-secondary)">
      <pre className="whitespace-pre-wrap">
        <code>{content}</code>
      </pre>
    </div>
  );
}
