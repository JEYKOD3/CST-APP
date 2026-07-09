export function formatScheduleWhen(start: Date, end: Date) {
  const day = start.toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = `${start.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })} – ${end.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}`;
  return { day, time };
}
