using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.MenuItems;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/menu-items")]
[Authorize]
public class MenuItemsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public MenuItemsController(ApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<List<MenuItemDto>>> GetMenuItems()
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var rows = await _context.MenuItems
            .Include(m => m.MenuCategory)
            .OrderBy(m => m.Name)
            .Select(m => new MenuItemDto
            {
                MenuItemId = m.MenuItemId,
                TenantId = m.TenantId,
                Name = m.Name,
                CategoryId = m.CategoryId,
                CategoryName = m.MenuCategory != null ? m.MenuCategory.Name : string.Empty,
                Description = m.Description,
                ImageUrl = m.ImageUrl,
                BasePrice = m.BasePrice,
                Status = m.Status,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt
            })
            .ToListAsync();

        return Ok(rows);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MenuItemDto>> GetMenuItem(int id)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var row = await BuildMenuItemDtoAsync(id);
        if (row == null)
        {
            return NotFound();
        }

        return Ok(row);
    }

    [HttpPost]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<MenuItemDto>> CreateMenuItem([FromBody] CreateMenuItemDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        try
        {
            ValidateMenuItemPayload(dto.Name, dto.BasePrice, dto.Status, dto.Ingredients, dto.Variants);
            await ValidateMenuReferencesAsync(dto.CategoryId, dto.Ingredients, dto.Variants, dto.TagIds);

            var now = DateTime.UtcNow;
            var menuItem = new MenuItem
            {
                TenantId = _currentUser.TenantId.Value,
                Name = dto.Name.Trim(),
                CategoryId = dto.CategoryId,
                Description = dto.Description,
                ImageUrl = dto.ImageUrl,
                BasePrice = dto.BasePrice,
                Status = dto.Status,
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.MenuItems.Add(menuItem);
            await _context.SaveChangesAsync();

            await AddRecipeGraphAsync(
                _currentUser.TenantId.Value,
                menuItem.MenuItemId,
                dto.Ingredients,
                dto.Variants,
                dto.TagIds);

            var created = await BuildMenuItemDtoAsync(menuItem.MenuItemId);
            if (created == null)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Menu item was created but could not be loaded." });
            }

            return CreatedAtAction(nameof(GetMenuItem), new { id = menuItem.MenuItemId }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<IActionResult> UpdateMenuItem(int id, [FromBody] UpdateMenuItemDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var menuItem = await _context.MenuItems.FirstOrDefaultAsync(m => m.MenuItemId == id);
        if (menuItem == null)
        {
            return NotFound();
        }

        try
        {
            ValidateMenuItemPayload(dto.Name, dto.BasePrice, dto.Status, dto.Ingredients, dto.Variants);
            await ValidateMenuReferencesAsync(dto.CategoryId, dto.Ingredients, dto.Variants, dto.TagIds);

            menuItem.Name = dto.Name.Trim();
            menuItem.CategoryId = dto.CategoryId;
            menuItem.Description = dto.Description;
            menuItem.ImageUrl = dto.ImageUrl;
            menuItem.BasePrice = dto.BasePrice;
            menuItem.Status = dto.Status;
            menuItem.UpdatedAt = DateTime.UtcNow;

            await ReplaceRecipeGraphAsync(
                _currentUser.TenantId.Value,
                menuItem.MenuItemId,
                dto.Ingredients,
                dto.Variants,
                dto.TagIds);

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<IActionResult> DeleteMenuItem(int id)
    {
        var menuItem = await _context.MenuItems.FirstOrDefaultAsync(m => m.MenuItemId == id);
        if (menuItem == null)
        {
            return NotFound();
        }

        menuItem.IsDeleted = true;
        menuItem.DeletedAt = DateTime.UtcNow;
        menuItem.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<MenuItemDto?> BuildMenuItemDtoAsync(int id)
    {
        var menuItem = await _context.MenuItems
            .Include(m => m.MenuCategory)
            .Include(m => m.Ingredients)
                .ThenInclude(i => i.Item)
            .FirstOrDefaultAsync(m => m.MenuItemId == id);

        if (menuItem == null)
        {
            return null;
        }

        var variants = await _context.MenuVariants
            .Where(v => v.MenuItemId == id)
            .OrderBy(v => v.DisplayOrder)
            .ThenBy(v => v.Name)
            .ToListAsync();

        var variantIds = variants.Select(v => v.VariantId).ToList();
        var variantIngredients = variantIds.Count == 0
            ? []
            : await _context.VariantIngredients
                .Include(v => v.Item)
                .Where(v => variantIds.Contains(v.VariantId))
                .ToListAsync();

        var tags = await _context.MenuItemTags
            .Include(t => t.Tag)
            .Where(t => t.MenuItemId == id)
            .ToListAsync();

        return new MenuItemDto
        {
            MenuItemId = menuItem.MenuItemId,
            TenantId = menuItem.TenantId,
            Name = menuItem.Name,
            CategoryId = menuItem.CategoryId,
            CategoryName = menuItem.MenuCategory?.Name ?? string.Empty,
            Description = menuItem.Description,
            ImageUrl = menuItem.ImageUrl,
            BasePrice = menuItem.BasePrice,
            Status = menuItem.Status,
            CreatedAt = menuItem.CreatedAt,
            UpdatedAt = menuItem.UpdatedAt,
            Ingredients = menuItem.Ingredients
                .OrderBy(i => i.MenuItemIngredientId)
                .Select(i => new MenuIngredientDto
                {
                    MenuItemIngredientId = i.MenuItemIngredientId,
                    ItemId = i.ItemId,
                    ItemName = i.Item?.Name ?? string.Empty,
                    ItemSku = i.Item?.SKU ?? string.Empty,
                    QuantityPerUnit = i.QuantityPerUnit,
                    UnitOfMeasure = i.UnitOfMeasure
                })
                .ToList(),
            Variants = variants.Select(v => new VariantDto
            {
                VariantId = v.VariantId,
                Name = v.Name,
                PricingMode = v.PricingMode,
                Price = v.Price,
                DisplayOrder = v.DisplayOrder,
                IsActive = v.IsActive,
                Ingredients = variantIngredients
                    .Where(i => i.VariantId == v.VariantId)
                    .Select(i => new MenuVariantIngredientDto
                    {
                        VariantIngredientId = i.VariantIngredientId,
                        ItemId = i.ItemId,
                        ItemName = i.Item?.Name ?? string.Empty,
                        ItemSku = i.Item?.SKU ?? string.Empty,
                        Quantity = i.Quantity
                    })
                    .ToList()
            }).ToList(),
            Tags = tags
                .Where(t => t.Tag != null)
                .Select(t => new MenuTagDto
                {
                    TagId = t.TagId,
                    Name = t.Tag!.Name,
                    Color = t.Tag.Color
                })
                .ToList()
        };
    }

    private async Task ReplaceRecipeGraphAsync(
        int tenantId,
        int menuItemId,
        List<CreateMenuItemIngredientDto> ingredients,
        List<CreateVariantDto> variants,
        List<int> tagIds)
    {
        var currentIngredients = await _context.MenuItemIngredients
            .Where(i => i.MenuItemId == menuItemId)
            .ToListAsync();

        if (currentIngredients.Count > 0)
        {
            _context.MenuItemIngredients.RemoveRange(currentIngredients);
        }

        var currentVariants = await _context.MenuVariants
            .Where(v => v.MenuItemId == menuItemId)
            .ToListAsync();

        if (currentVariants.Count > 0)
        {
            var currentVariantIds = currentVariants.Select(v => v.VariantId).ToList();

            var currentVariantIngredients = await _context.VariantIngredients
                .Where(i => currentVariantIds.Contains(i.VariantId))
                .ToListAsync();

            if (currentVariantIngredients.Count > 0)
            {
                _context.VariantIngredients.RemoveRange(currentVariantIngredients);
            }

            _context.MenuVariants.RemoveRange(currentVariants);
        }

        var currentTags = await _context.MenuItemTags
            .Where(t => t.MenuItemId == menuItemId)
            .ToListAsync();

        if (currentTags.Count > 0)
        {
            _context.MenuItemTags.RemoveRange(currentTags);
        }

        await _context.SaveChangesAsync();

        await AddRecipeGraphAsync(tenantId, menuItemId, ingredients, variants, tagIds);
    }

    private async Task AddRecipeGraphAsync(
        int tenantId,
        int menuItemId,
        List<CreateMenuItemIngredientDto> ingredients,
        List<CreateVariantDto> variants,
        List<int> tagIds)
    {
        if (ingredients.Count > 0)
        {
            _context.MenuItemIngredients.AddRange(ingredients.Select(i => new MenuItemIngredient
            {
                TenantId = tenantId,
                MenuItemId = menuItemId,
                ItemId = i.ItemId,
                QuantityPerUnit = i.QuantityPerUnit,
                UnitOfMeasure = i.UnitOfMeasure
            }));
        }

        var variantEntities = variants.Select(v => new MenuVariant
        {
            MenuItemId = menuItemId,
            Name = v.Name.Trim(),
            PricingMode = v.PricingMode.Trim().ToLowerInvariant(),
            Price = v.Price,
            DisplayOrder = v.DisplayOrder,
            IsActive = v.IsActive
        }).ToList();

        if (variantEntities.Count > 0)
        {
            _context.MenuVariants.AddRange(variantEntities);
            await _context.SaveChangesAsync();

            var variantIngredients = new List<VariantIngredient>();

            for (var index = 0; index < variantEntities.Count; index++)
            {
                var variantEntity = variantEntities[index];
                var variantDto = variants[index];

                variantIngredients.AddRange(variantDto.Ingredients.Select(ingredient => new VariantIngredient
                {
                    VariantId = variantEntity.VariantId,
                    ItemId = ingredient.ItemId,
                    Quantity = ingredient.Quantity
                }));
            }

            if (variantIngredients.Count > 0)
            {
                _context.VariantIngredients.AddRange(variantIngredients);
            }
        }

        var distinctTagIds = tagIds
            .Where(t => t > 0)
            .Distinct()
            .ToList();

        if (distinctTagIds.Count > 0)
        {
            _context.MenuItemTags.AddRange(distinctTagIds.Select(tagId => new MenuItemTag
            {
                MenuItemId = menuItemId,
                TagId = tagId
            }));
        }

        await _context.SaveChangesAsync();
    }

    private async Task ValidateMenuReferencesAsync(
        int categoryId,
        List<CreateMenuItemIngredientDto> ingredients,
        List<CreateVariantDto> variants,
        List<int> tagIds)
    {
        var categoryExists = await _context.MenuCategories
            .AnyAsync(c => c.CategoryId == categoryId && c.IsActive);

        if (!categoryExists)
        {
            throw new InvalidOperationException("Menu category was not found.");
        }

        var itemIds = ingredients
            .Select(i => i.ItemId)
            .Concat(variants.SelectMany(v => v.Ingredients.Select(i => i.ItemId)))
            .Where(i => i > 0)
            .Distinct()
            .ToList();

        if (itemIds.Count > 0)
        {
            var count = await _context.Items.CountAsync(i => itemIds.Contains(i.ItemId));
            if (count != itemIds.Count)
            {
                throw new InvalidOperationException("One or more ingredient items are invalid.");
            }
        }

        var distinctTagIds = tagIds
            .Where(t => t > 0)
            .Distinct()
            .ToList();

        if (distinctTagIds.Count > 0)
        {
            var tagCount = await _context.MenuTags
                .CountAsync(t => distinctTagIds.Contains(t.TagId) && t.IsActive);

            if (tagCount != distinctTagIds.Count)
            {
                throw new InvalidOperationException("One or more menu tags are invalid.");
            }
        }
    }

    private static void ValidateMenuItemPayload(
        string name,
        decimal basePrice,
        string status,
        List<CreateMenuItemIngredientDto> ingredients,
        List<CreateVariantDto> variants)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new InvalidOperationException("Menu item name is required.");
        }

        if (basePrice < 0)
        {
            throw new InvalidOperationException("Base price cannot be negative.");
        }

        if (string.IsNullOrWhiteSpace(status))
        {
            throw new InvalidOperationException("Menu status is required.");
        }

        foreach (var ingredient in ingredients)
        {
            if (ingredient.ItemId <= 0)
            {
                throw new InvalidOperationException("Ingredient item is required.");
            }

            if (ingredient.QuantityPerUnit <= 0)
            {
                throw new InvalidOperationException("Ingredient quantity must be greater than zero.");
            }
        }

        foreach (var variant in variants)
        {
            if (string.IsNullOrWhiteSpace(variant.Name))
            {
                throw new InvalidOperationException("Variant name is required.");
            }

            var pricingMode = variant.PricingMode.Trim().ToLowerInvariant();
            if (pricingMode is not ("absolute" or "relative"))
            {
                throw new InvalidOperationException("Variant pricing mode must be absolute or relative.");
            }

            foreach (var ingredient in variant.Ingredients)
            {
                if (ingredient.ItemId <= 0)
                {
                    throw new InvalidOperationException("Variant ingredient item is required.");
                }

                if (ingredient.Quantity <= 0)
                {
                    throw new InvalidOperationException("Variant ingredient quantity must be greater than zero.");
                }
            }
        }
    }
}
