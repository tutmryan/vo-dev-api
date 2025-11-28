# OIDC Browser Testing

## Pages to Test

| Page       | How to trigger                                                               |
| ---------- | ---------------------------------------------------------------------------- |
| Login      | Standard OIDC flow                                                           |
| Error      | Reload the login page after the QR code appears                              |
| No Session | Modify the route handler to render `no-session` directly (see snippet below) |

```ts
app.get(`${route}/interaction/:uid`, noCache, async (req, res, next) => {
  return res.render('no-session', { voLogoUrl })
})
```

## Browser Matrix

Test all three pages in each environment:

### Standard Browsers

- [ ] Chrome / Edge (Chromium)
- [ ] Firefox
- [ ] Safari

### Mobile

- [ ] iOS Safari
- [ ] Android Chrome / Edge
- [ ] Android Firefox

### Windows Embedded (Teams)

**Environment:** Windows 10/11 with Teams installed

**Credentials:** `Entra ID EAM VO OIDC LocalDev - User` from Bitwarden (see repo README for setup)

**Engine:** Chromium 70

- [ ] Login page
- [ ] No session page

> Error page testing is impractical in this embedded browser.

### GlobalProtect VPN (IE11)

**Background:** [PL-2272](https://verifiedorchestration.atlassian.net/browse/PL-2272)

**Environment:** [Windows 10 Dev VM](https://download.microsoft.com/download/b/7/a/b7a6fb6e-cae1-4e19-9249-205803bc4ada/WinDev2004Eval.VMware.zip) (VMware or VirtualBox)

**Install file:** See Jira ticket

GlobalProtect uses Chromium normally, but falls back to IE11 in the Windows pre-login environment.

- [ ] Login page
- [ ] Error page

> No session page testing is impractical in this embedded browser. page

**Notes:**

- Enable pre-login mode: `PanGPS.EXE -registerplap` then restart
- Pre-login environment uses production pages—local changes cannot be tested there
