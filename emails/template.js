import fs from "fs";
import path from "path";
export function email(code) {
  const cssPath = path.join(process.cwd(), "emails", "verification.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          ${css}
        </style>
      </head>

      <body>
        <div class="wrapper">
          <div class="card">
            <div class="header">
              <h1 class="title">Verify Your Email</h1>
              <p class="subtitle">One last step to complete your signup</p>
            </div>

            <div class="body">
              <p class="text">
                Use the verification code below to confirm your email address.
              </p>

              <div class="code">${code}</div>

              <p class="small">
                This code will expire in <strong>5 minutes</strong>.
                If you did not request this, you can safely ignore this email.
              </p>
            </div>

            <div class="footer">
              <p class="footer-text">
                © 2026 CTIS256 Project. All rights reserved by Barkın, Gökçe and Afruz.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}