import { useToasts } from "@/hooks/useToasts";

export const Toasts = () => {
  const { toasts, remove } = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="toasts">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.kind}`}>
          <div>
            <div className="toast__title">{toast.title}</div>
            {toast.message && <div className="toast__message">{toast.message}</div>}
          </div>
          <button className="toast__close" onClick={() => remove(toast.id)} type="button">
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
};
