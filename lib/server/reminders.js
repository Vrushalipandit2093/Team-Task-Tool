import { sendDailyTaskListEmail } from "./automation.js";

export async function sendTaskReminders(selectedDate) {
  return sendDailyTaskListEmail(selectedDate);
}
