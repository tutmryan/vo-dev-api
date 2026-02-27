export enum UserRoles {
  reader = 'VerifiableCredential.Reader',
  issuer = 'VerifiableCredential.Issuer',
  credentialAdmin = 'VerifiableCredential.CredentialAdmin',
  partnerAdmin = 'VerifiableCredential.PartnerAdmin',
  oidcAdmin = 'VerifiableCredential.OidcAdmin',
  instanceAdmin = 'VerifiableCredential.InstanceAdmin',
  supportAgent = 'VerifiableCredential.SupportAgent',
  credentialRevoker = 'credentials.revoke',
  presentationFlowCreate = 'presentationFlow.create',
  presentationFlowRead = 'presentationFlow.read',
  presentationFlowCancel = 'presentationFlow.cancel',
  presentationFlowCreateTemplate = 'presentationFlow.template.create',
  presentationFlowReadTemplate = 'presentationFlow.template.read',
  presentationFlowUpdateTemplate = 'presentationFlow.template.update',
  presentationFlowDeleteTemplate = 'presentationFlow.template.delete',
  toolsAPIExplorerAccess = 'tools.apiExplorer.access',
}

export enum OidcScopes {
  issuee = 'VerifiableCredential.Issuee',
}

export enum AppRoles {
  issue = 'VerifiableCredential.Issue',
  present = 'VerifiableCredential.Present',
  contractAdmin = 'VerifiableCredential.ContractAdmin',
  credentialsRevoke = 'credentials.revoke',
  presentationFlowCreate = 'presentationFlow.create',
  presentationFlowRead = 'presentationFlow.read',
  presentationFlowCancel = 'presentationFlow.cancel',
  presentationFlowCreateTemplate = 'presentationFlow.template.create',
  presentationFlowReadTemplate = 'presentationFlow.template.read',
  presentationFlowUpdateTemplate = 'presentationFlow.template.update',
  presentationFlowDeleteTemplate = 'presentationFlow.template.delete',
}

export enum LimitedAccessTokenAcquisitionRoles {
  issuance = 'VerifiableCredential.AcquireLimitedAccessToken.Issue',
  presentation = 'VerifiableCredential.AcquireLimitedAccessToken.Present',
  listContracts = 'VerifiableCredential.AcquireLimitedAccessToken.ListContracts',
  anonymousPresentations = 'VerifiableCredential.AcquireLimitedAccessToken.AnonymousPresentations',
}

export enum InternalRoles {
  limitedAccess = 'VerifiableCredential.LimitedAccess',
  limitedPresentationFlow = 'VerifiableCredential.LimitedPresentationFlow',
  limitedPhotoCapture = 'VerifiableCredential.LimitedPhotoCapture',
  limitedAsyncIssuance = 'VerifiableCredential.LimitedAsyncIssuance',
  callback = 'VerifiableCredential.Request.Callback',
}

export enum InternalClientRoles {
  limitedOidcAuthn = 'VerifiableCredential.LimitedOidcAuthn',
}
