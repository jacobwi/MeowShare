// Format milliseconds to readable format
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

// Get status color based on HTTP status code
export const getStatusColor = (
  status?: number,
):
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "error"
  | "info"
  | "warning" => {
  if (!status) return "default";
  if (status < 300) return "success";
  if (status < 400) return "info";
  if (status < 500) return "warning";
  return "error";
};

// Format a timestamp to a readable date/time with milliseconds
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const dateStr = date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const msStr = date.getMilliseconds().toString().padStart(3, "0");
  return `${dateStr}.${msStr}`;
};
