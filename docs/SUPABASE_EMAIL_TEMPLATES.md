# Supabase Email Templates for Give

Copy these templates into **Supabase Dashboard → Authentication → Email Templates**. They use app CSS colors (emerald/slate), Outlook-safe markup, and Unsplash/Pexels images. Gmail may block images by default—users can click "Display images" to show them.

**Outlook notes:** Uses tables, inline styles, and solid `background-color` (no gradients). Images use full URLs from Unsplash/Pexels.

**Image loading:** If images don't load, your email client may block external images by default. Try "Display images" in Gmail, or use the verified URLs in the table at the bottom.

---

## 1. Confirm signup

**Subject:** `Confirm your Give account`

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your signup</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #334155;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 0;">
              <img src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=560" alt="Give — Start giving in minutes" width="560" height="280" style="display: block; width: 560px; height: 280px; border: 0; border-collapse: collapse;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 24px;">
              <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #0f172a;">Confirm your signup</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #475569;">Follow this link to confirm your user:</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #059669;">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">Confirm your account</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px; font-size: 12px; color: #94a3b8;">© The Exchange. All rights reserved.</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Invite user

**Subject:** `You have been invited to Give`

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You have been invited</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #334155;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 0;">
              <img src="https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&amp;w=560" alt="Give — You have been invited" width="560" height="280" style="display: block; width: 560px; height: 280px; border: 0; border-collapse: collapse;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 24px;">
              <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #0f172a;">You have been invited</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #475569;">You have been invited to create a user on {{ .SiteURL }}. Follow this link to accept the invite:</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #059669;">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">Accept the invite</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px; font-size: 12px; color: #94a3b8;">© The Exchange. All rights reserved.</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Change email

**Subject:** `Confirm change of email`

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm change of email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #334155;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 0;">
              <img src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=560" alt="Give — Confirm email change" width="560" height="200" style="display: block; width: 560px; height: 200px; border: 0; border-collapse: collapse;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 24px;">
              <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #0f172a;">Confirm Change of Email</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #475569;">Follow this link to confirm the update of your email from {{ .Email }} to {{ .NewEmail }}:</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #059669;">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">Change Email</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px; font-size: 12px; color: #94a3b8;">© The Exchange. All rights reserved.</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Reset password

**Subject:** `Reset your Give password`

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #334155;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 0;">
              <img src="https://images.pexels.com/photos/6054/pexels-photo-6054.jpeg?auto=compress&amp;w=560" alt="Give — Reset your password" width="560" height="200" style="display: block; width: 560px; height: 200px; border: 0; border-collapse: collapse;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 24px;">
              <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #0f172a;">Reset Password</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #475569;">Follow this link to reset the password for your user:</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #059669;">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">Reset Password</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; font-size: 14px; color: #94a3b8;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px; font-size: 12px; color: #94a3b8;">© The Exchange. All rights reserved.</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Image URLs (Unsplash & Pexels)

If images don't load, try these steps:
1. **Gmail:** Click "Display images" or "Images are not displayed" at the top of the email
2. **Outlook:** Right-click the broken image → "Download pictures"
3. **Swap URL:** If still broken, use the fallback URLs below

| Template       | Primary URL (Unsplash/Pexels) | Fallback (if blocked) |
|----------------|------------------------------|------------------------|
| Confirm signup | `https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=560` | `https://placehold.co/560x280/059669/ffffff/png?text=Give` |
| Invite user    | `https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&w=560` | `https://placehold.co/560x280/047857/ffffff/png?text=Invited` |
| Change email   | `https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=560` | `https://placehold.co/560x200/059669/ffffff/png?text=Email` |
| Reset password | `https://images.pexels.com/photos/6054/pexels-photo-6054.jpeg?auto=compress&w=560` | `https://placehold.co/560x200/047857/ffffff/png?text=Reset` |

**Note:** In HTML `img src`, use `&amp;` instead of `&` for query params (e.g. `?auto=compress&amp;w=560`). Supabase may auto-escape this.

---

## How to apply in Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Go to **Authentication** → **Email Templates**
3. For each template (Confirm signup, Invite user, Change email address, Reset password):
   - Set the **Subject** to the value above
   - Paste the **Body** HTML into the content editor
4. Save each template

**Important:** Do not remove `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}`, or `{{ .SiteURL }}` — Supabase replaces these when sending.
