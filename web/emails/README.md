# SPST e-mail šablóny (react-email)

React komponenty → HTML s `{{Token}}` → EmailService ich naplní a odošle (HTML + plain text).

## Príkazy

```bash
cd web
npm run emails:dev    # preview http://localhost:3002
npm run emails:build  # → src/EmailService/Templates/*.html
```

Po úprave šablóny vždy spusti `emails:build` a commituj vygenerované HTML (EmailService ich číta zo súborov).

## Šablóny

| Súbor | Kedy |
|-------|------|
| `LoanBorrowed` | Checkout / vydanie výpožičky |
| `LoanReturned` | Vrátenie knihy |
| `LoanDueReminder` | Pripomienka termínu |
| `WaitlistReady` | Waitlist → rezervácia ready |

## Tokeny

`BorrowerName`, `BookTitle`, `DueDate`, `BorrowedAt`, `ReturnedAt`, `CatalogUrl`, `MyLibraryUrl`
