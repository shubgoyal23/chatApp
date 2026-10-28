// Mirrors the server-side password validator in api_server's user model.
export const PASSWORD_RULES = [
   { test: (p) => p.length >= 8, label: "8+ characters" },
   { test: (p) => /[a-z]/.test(p), label: "lowercase" },
   { test: (p) => /[A-Z]/.test(p), label: "uppercase" },
   { test: (p) => /\d/.test(p), label: "number" },
   { test: (p) => /[@$!%*?&]/.test(p), label: "symbol (@$!%*?&)" },
];

export const passwordValid = (p) =>
   PASSWORD_RULES.every((r) => r.test(p)) && /^[A-Za-z\d@$!%*?&]+$/.test(p);
