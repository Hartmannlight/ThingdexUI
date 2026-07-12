import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";

export const PageHeader = ({ title, eyebrow, actions }: { title: string; eyebrow?: string; actions?: ReactNode }) => {
  const router = useRouter();
  return (
    <div className="page-header">
      <button className="icon-button page-header__back" onClick={() => router.history.back()} aria-label="Zurück">
        <Icon name="arrow-left" />
      </button>
      <div className="page-header__copy">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  );
};
