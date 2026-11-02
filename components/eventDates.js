// components/eventDates.js

// "YYYY-MM-DD" + 1 day (done in UTC so time zones can't shift the date)
export function addOneDay(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().split("T")[0];
}

// If an event ends at a clock time EARLIER than it starts (10:00 PM -> 2:00 AM), it ends the next
// morning, so the End Date moves to the next day automatically. If you later change the End Time so
// it's no longer overnight, the End Date goes back — unless you picked the End Date yourself.
export function adjustOvernight(form, changedField, wasAuto) {
  if (changedField === "event_end_date") return { form, auto: false };
  const { event_date, event_end_date, event_start_time, event_end_time } = form;
  if (!event_date || !event_start_time || !event_end_time) return { form, auto: wasAuto };
  const overnight = event_end_time < event_start_time; // "HH:MM" 24-hour strings compare correctly
  if (overnight && (!event_end_date || event_end_date === event_date || wasAuto)) {
    return { form: { ...form, event_end_date: addOneDay(event_date) }, auto: true };
  }
  if (!overnight && wasAuto) return { form: { ...form, event_end_date: event_date }, auto: false };
  return { form, auto: wasAuto };
}
