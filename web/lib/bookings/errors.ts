export function explainBookingError(message: string): string {
  if (/\bborroweremail\b/i.test(message)) {
    return "Email nie je v správnom tvare.";
  }
  if (/\bborrowername\b/i.test(message)) return "Meno čitateľa je povinné.";
  if (/\bduedate\b/i.test(message)) return "Vyber termín vrátenia.";
  if (/\bbookcopyid\b/i.test(message) || /active reservation/i.test(message)) {
    return "Tento exemplár už má aktívnu výpožičku.";
  }
  if (
    message.startsWith("API ") ||
    /fetch failed/i.test(message) ||
    /ECONNREFUSED/i.test(message) ||
    /\b502\b/.test(message) ||
    /\b503\b/.test(message)
  ) {
    return "Výpožičný pult neodpovedá. Skontroluj, či beží gateway na porte 5200.";
  }
  return message;
}
