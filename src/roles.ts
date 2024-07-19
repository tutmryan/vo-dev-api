export enum UserRoles {
  reader = 'VerifiableCredential.Reader',
  issuer = 'VerifiableCredential.Issuer',
  credentialAdmin = 'VerifiableCredential.CredentialAdmin',
  partnerAdmin = 'VerifiableCredential.PartnerAdmin',
  approvalRequestAdmin = 'VerifiableCredential.ApprovalRequestAdmin',
}

export enum AppRoles {
  issue = 'VerifiableCredential.Issue',
  present = 'VerifiableCredential.Present',
  requestApproval = 'VerifiableCredential.RequestApproval',
}

export enum InternalRoles {
  limitedAccess = 'VerifiableCredential.LimitedAccess',
  limitedApproval = 'VerifiableCredential.LimitedApproval',
  limitedPhotoCapture = 'VerifiableCredential.LimitedPhotoCapture',
  callback = 'VerifiableCredential.Request.Callback',
}
