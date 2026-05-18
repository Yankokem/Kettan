namespace Kettan.Server.Enums;

public enum UserRole : byte
{
    SuperAdmin = 0,
    TenantAdmin = 1,
    HqManager = 2,
    HqStaff = 3,
    BranchOwner = 4,
    BranchManager = 5,
}
