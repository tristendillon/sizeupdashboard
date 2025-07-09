export function relativeTs(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months !== 1 ? "s" : ""} ago`;
  }

  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? "s" : ""} ago`;
}

export function detailedRelativeTs(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  const parts: string[] = [];

  if (years > 0) {
    parts.push(`${years} year${years !== 1 ? "s" : ""}`);
    const remMonths = months % 12;
    if (remMonths > 0) {
      parts.push(`${remMonths} month${remMonths !== 1 ? "s" : ""}`);
    }
  } else if (months > 0) {
    parts.push(`${months} month${months !== 1 ? "s" : ""}`);
    const remDays = days % 30;
    if (remDays > 0) {
      parts.push(`${remDays} day${remDays !== 1 ? "s" : ""}`);
    }
  } else if (days > 0) {
    parts.push(`${days} day${days !== 1 ? "s" : ""}`);
    const remHours = hours % 24;
    if (remHours > 0) {
      parts.push(`${remHours} hour${remHours !== 1 ? "s" : ""}`);
    }
  } else if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
    const remMinutes = minutes % 60;
    if (remMinutes > 0) {
      parts.push(`${remMinutes} minute${remMinutes !== 1 ? "s" : ""}`);
    }
  } else {
    parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  }

  return parts.slice(0, 2).join(" ") + " ago";
}
