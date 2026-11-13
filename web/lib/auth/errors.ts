const SCOPE_HINT =
  "V Entra chýba scope access_as_user. V portáli: Expose an API → Add scope „access_as_user“, alebo v termináli: ./scripts/entra-expose-scope.sh";

export function formatAuthError(message: string): string {
  if (/AADSTS500011|invalid_resource|resource principal named/i.test(message)) {
    return `${message}\n\n${SCOPE_HINT} (najprv Application ID URI: api://…).`;
  }
  if (/AADSTS65005|access_as_user.*doesn't exist|scope.*doesn't exist/i.test(message)) {
    return `${message}\n\n${SCOPE_HINT}`;
  }
  return message;
}
