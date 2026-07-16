using System;
using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.DTOs.Suppliers;

public class SupplierDto
{
    public int SupplierId { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public bool IsActive { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateSupplierDto
{
    [Required]
    [StringLength(30, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(30)]
    public string? ContactPerson { get; set; }

    [EmailAddress]
    [StringLength(30)]
    public string? Email { get; set; }

    [RegularExpression(@"^[+]?[-()\d\s]{7,20}$", ErrorMessage = "Invalid phone number format.")]
    [StringLength(20)]
    public string? Phone { get; set; }

    [StringLength(50)]
    public string? Address { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateSupplierDto
{
    [Required]
    [StringLength(30, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(30)]
    public string? ContactPerson { get; set; }

    [EmailAddress]
    [StringLength(30)]
    public string? Email { get; set; }

    [RegularExpression(@"^[+]?[-()\d\s]{7,20}$", ErrorMessage = "Invalid phone number format.")]
    [StringLength(20)]
    public string? Phone { get; set; }

    [StringLength(50)]
    public string? Address { get; set; }
    public bool IsActive { get; set; }
}
