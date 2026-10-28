// Domains reserved for documentation and testing (RFC 2606 / RFC 6761). Mail
// to them can never be delivered, so we never send it.
const RESERVED_DOMAIN = /(^|\.)(example\.(com|net|org)|example|test|invalid|localhost)$/i;

export const isUndeliverableEmail = (email) => {
   const domain = String(email ?? "").split("@").pop().trim();
   return !domain || RESERVED_DOMAIN.test(domain);
};

// Test accounts (utils/testUsers.js) and reserved addresses never get email.
export const canReceiveEmail = (user) =>
   Boolean(user) && !user.isTestUser && !isUndeliverableEmail(user.email);
