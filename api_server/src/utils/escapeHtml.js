// Escapes user-controlled text before it is interpolated into HTML emails.
export const escapeHtml = (value) =>
   String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
         ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
         })[c]
   );
