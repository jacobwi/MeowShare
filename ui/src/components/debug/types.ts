import { RequestLog } from "../../constants/debug";

export interface DebugHelperProps {
  children: React.ReactNode;
}

export interface DebugPanelProps {
  onClose: () => void;
}

export interface LogDetailViewProps {
  log: RequestLog;
  onClose: () => void;
}

export interface JsonViewerProps {
  data: unknown;
  showRaw?: boolean;
  onCopy?: () => void;
  copySuccess?: boolean;
}
