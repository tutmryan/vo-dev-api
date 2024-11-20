import type { KoaContextWithOIDC } from 'oidc-provider'
import { voLogoUrl } from './logos'

export function logoutSource(ctx: KoaContextWithOIDC, form: string) {
  // @param ctx - koa request context
  // @param form - form source (id="op.logoutForm") to be embedded in the page and submitted by
  //   the End-User
  ctx.body = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>Logout Request</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"
      integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <style>
      body {
        margin-top: 25px;
        margin-bottom: 25px;
      }
      .container {
        padding: 20px 10px;
        min-width: 250px;
        max-width: 94%;
        background-color: #F7F7F7;
        margin: 10px auto 10px;
        border-radius: 2px;
        box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.3);
        overflow: hidden;
      }
      @media (min-width: 575px) {
        .container {
          padding: 30px;
          width: 450px;
        }
      }
      .container h1 {
        font-weight: 200;
        text-align: center;
      }
      .container h2 {
        font-weight: 400;
        text-align: center;
        text-wrap: nowrap;
      }
      .container [type=submit] {
        width: 100%;
        display: block;
        margin-bottom: 10px;
        position: relative;
      }
    </style>
  </head>
  <body>
    <div class="d-flex justify-content-center mb-4"><img src="${voLogoUrl}" alt="Verified Orchestration Logo" style="max-width:10rem"></div>
    <div class="container">
      <h1>Sign out from</h1>
      <h2>${ctx.oidc.client?.clientName ?? ctx.host}</h2>
      ${form}
      <button autofocus type="submit" form="op.logoutForm" value="yes" name="logout" class="btn btn-primary mt-4">Yes, sign me out</button>
      <button type="submit" form="op.logoutForm" class="btn btn-secondary">No, stay signed in</button>
    </div>
  </body>
  </html>`
}
