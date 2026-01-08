export type StatusKind = "success" | "warning" | "error" | "info";

export type StatusBannerProps = {
  kind: StatusKind;
  title: string;
  message?: string;
};

export const StatusBanner = ({ kind, title, message }: StatusBannerProps) => {
  return (
    <div className={`status status--${kind}`}>
      <div className="status__title">{title}</div>
      {message && <div className="status__message">{message}</div>}
    </div>
  );
};
