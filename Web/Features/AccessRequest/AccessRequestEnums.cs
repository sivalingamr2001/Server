namespace Server.Features.AccessRequest;

/// <summary>
/// Access request lifecycle status
/// </summary>
public enum AccessItemStatus
{
    Submitted = 0,
    HodApproved = 1,
    HodRejected = 2,
    OperatorApproved = 3,
    OperatorRejected = 4,
    AccessGranted = 5,
    AccessDenied = 6,
    AccessExpired = 7,
    AccessRevoked = 8
}

/// <summary>
/// Type of access being requested
/// </summary>
public enum AccessType
{
    NotApplicable = 0,
    ReadOnly = 1,
    ReadAndWrite = 2
}

/// <summary>
/// Binary active state flag
/// </summary>
public enum ActiveState
{
    Inactive = 0,
    Active = 1
}

/// <summary>
/// Agreement state for access requests
/// </summary>
public enum AgreementState
{
    NotAgreed = 0,
    Agreed = 1
}