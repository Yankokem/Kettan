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
    public decimal QuantityPerUnit { get; set; }
    public string? UnitOfMeasure { get; set; }
}

public class CreateMenuVariantIngredientDto
{
    public int ItemId { get; set; }
    public decimal Quantity { get; set; }
}

public class CreateVariantDto
{
    public string Name { get; set; } = string.Empty;
    public string PricingMode { get; set; } = "absolute";
    public decimal Price { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public List<CreateMenuVariantIngredientDto> Ingredients { get; set; } = [];
}

public class CreateMenuItemDto
{
    public string Name { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public decimal BasePrice { get; set; }
    public string Status { get; set; } = "Active";
    public List<CreateMenuItemIngredientDto> Ingredients { get; set; } = [];
    public List<CreateVariantDto> Variants { get; set; } = [];
    public List<int> TagIds { get; set; } = [];
}

public class UpdateMenuItemDto
{
    public string Name { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public decimal BasePrice { get; set; }
    public string Status { get; set; } = "Active";
    public List<CreateMenuItemIngredientDto> Ingredients { get; set; } = [];
    public List<CreateVariantDto> Variants { get; set; } = [];
    public List<int> TagIds { get; set; } = [];
}
