import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  action?: ReactNode;
  label: string;
  value: string;
  isActive?: boolean;
};

export function Metric({ action, label, value, isActive = false }: Props) {
  return (
    <div className={`metric ${action ? "metric-with-action" : ""} ${isActive ? "metric-active" : ""}`}>
      <div className="metric-content">
        <span>{label}</span>
        <strong>
          {isActive ? <LoaderCircle className="spinner" size={17} /> : null}
          {value}
        </strong>
      </div>
      {action ? <div className="metric-action">{action}</div> : null}
    </div>
  );
}
