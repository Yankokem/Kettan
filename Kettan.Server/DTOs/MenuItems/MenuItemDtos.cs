using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.DTOs.MenuItems;

public class MenuTagDto
{
    public int TagId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
}

public class MenuIngredientDto
{
    public int MenuItemIngredientId { get; set; }
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSku { get; set; } = string.Empty;
    public decimal QuantityPerUnit { get; set; }
    public string? UnitOfMeasure { get; set; }
}

public class MenuVariantIngredientDto
{
    public int VariantIngredientId { get; set; }
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSku { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
}

public class VariantDto
{
    public int VariantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PricingMode { get; set; } = "absolute";
    public decimal Price { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public List<MenuVariantIngredientDto> Ingredients { get; set; } = [];
}

public class MenuItemDto
{
    public int MenuItemId { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public decimal BasePrice { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<MenuIngredientDto> Ingredients { get; set; } = [];
    public List<VariantDto> Variants { get; set; } = [];
    public List<MenuTagDto> Tags { get; set; } = [];
}

public class CreateMenuItemIngredientDto
{
    public int ItemId { get; set; }

    [Range(0.0001, double.MaxValue, ErrorMessage = "Quantity per unit must be greater than zero.")]
    public decimal QuantityPerUnit { get; set; }

    [StringLength(20)]
    public string? UnitOfMeasure { get; set; }
}

public class CreateMenuVariantIngredientDto
{
    public int ItemId { get; set; }

    [Range(0.0001, double.MaxValue, ErrorMessage = "Quantity must be greater than zero.")]
    public decimal Quantity { get; set; }
}

public class CreateVariantDto
{
    [Required]
    [StringLength(50)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string PricingMode { get; set; } = "absolute";

    [Range(0, double.MaxValue, ErrorMessage = "Price cannot be negative.")]
    public decimal Price { get; set; }

    [Range(0, int.MaxValue)]
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public List<CreateMenuVariantIngredientDto> Ingredients { get; set; } = [];
}

public class CreateMenuItemDto
{
    [Required]
    [StringLength(50)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public int CategoryId { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    [StringLength(300)]
    public string? ImageUrl { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Base price cannot be negative.")]
    public decimal BasePrice { get; set; }

    [Required]
    [StringLength(20)]
    public string Status { get; set; } = "Active";

    public List<CreateMenuItemIngredientDto> Ingredients { get; set; } = [];
    public List<CreateVariantDto> Variants { get; set; } = [];
    public List<int> TagIds { get; set; } = [];
}

public class UpdateMenuItemDto
{
    [Required]
    [StringLength(50)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public int CategoryId { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    [StringLength(300)]
    public string? ImageUrl { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Base price cannot be negative.")]
    public decimal BasePrice { get; set; }

    [Required]
    [StringLength(20)]
    public string Status { get; set; } = "Active";

    public List<CreateMenuItemIngredientDto> Ingredients { get; set; } = [];
    public List<CreateVariantDto> Variants { get; set; } = [];
    public List<int> TagIds { get; set; } = [];
}
