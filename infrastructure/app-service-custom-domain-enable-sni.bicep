param name string
param certificateThumbprint string

resource hostNameBindingsSniEnabled 'Microsoft.Web/sites/hostNameBindings@2020-06-01' = {
  name: name
  properties: {
    sslState: 'SniEnabled'
    thumbprint: certificateThumbprint
  }
}
