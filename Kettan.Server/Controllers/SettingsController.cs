using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Settings;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class SettingsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public SettingsController(ApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet("item-categories")]
    public async Task<ActionResult<List<ItemCategoryDto>>> GetItemCategories()
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var rows = await _context.ItemCategories
            .IgnoreQueryFilters()
            .Where(c => c.TenantId == _currentUser.TenantId.Value)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .Select(c => new ItemCategoryDto
            {
                ItemCategoryId = c.ItemCategoryId,
                Name = c.Name,
                Description = c.Description,
                DisplayOrder = c.DisplayOrder,
                IsActive = c.IsActive,
                IsDeleted = c.IsDeleted,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return Ok(rows);
    }

    [HttpPost("item-categories")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<ItemCategoryDto>> CreateItemCategory([FromBody] CreateItemCategoryDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        try
        {
            ValidateLookupName(dto.Name, "Item category name is required.");

            var normalizedName = dto.Name.Trim();
            var exists = await _context.ItemCategories.AnyAsync(c => c.Name == normalizedName);
            if (exists)
            {
                throw new InvalidOperationException("Item category already exists.");
            }

            var row = new ItemCategory
            {
                TenantId = _currentUser.TenantId.Value,
                Name = normalizedName,
                Description = dto.Description,
                DisplayOrder = dto.DisplayOrder,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.ItemCategories.Add(row);
            await _context.SaveChangesAsync();

            return Ok(new ItemCategoryDto
            {
                ItemCategoryId = row.ItemCategoryId,
                Name = row.Name,
                Description = row.Description,
                DisplayOrder = row.DisplayOrder,
                IsActive = row.IsActive,
                IsDeleted = row.IsDeleted,
                CreatedAt = row.CreatedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("item-categories/{id:int}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<ItemCategoryDto>> UpdateItemCategory(int id, [FromBody] CreateItemCategoryDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var row = await _context.ItemCategories.FirstOrDefaultAsync(c => c.ItemCategoryId == id);
        if (row == null)
        {
            return NotFound();
        }

        try
        {
            ValidateLookupName(dto.Name, "Item category name is required.");

            var normalizedName = dto.Name.Trim();
            var exists = await _context.ItemCategories.AnyAsync(c => c.Name == normalizedName && c.ItemCategoryId != id);
            if (exists)
            {
                throw new InvalidOperationException("Item category already exists.");
            }

            row.Name = normalizedName;
            row.Description = dto.Description;
            row.DisplayOrder = dto.DisplayOrder;
            row.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();

            return Ok(new ItemCategoryDto
            {
                ItemCategoryId = row.ItemCategoryId,
                Name = row.Name,
                Description = row.Description,
                DisplayOrder = row.DisplayOrder,
                IsActive = row.IsActive,
                IsDeleted = row.IsDeleted,
                CreatedAt = row.CreatedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("item-categories/{id:int}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<IActionResult> DeleteItemCategory(int id)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var row = await _context.ItemCategories.FirstOrDefaultAsync(c => c.ItemCategoryId == id);
        if (row == null)
        {
            return NotFound();
        }

        var hasItems = await _context.Items.AnyAsync(i => i.ItemCategoryId == id);
        if (hasItems)
        {
            return BadRequest(new { message = "Cannot delete item category while items are still using it." });
        }

        row.IsActive = false;
        row.IsDeleted = true;
        row.DeletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("inventory-categories")]
    public async Task<ActionResult<List<InventoryCategoryDto>>> GetInventoryCategories()
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var rows = await _context.InventoryCategories
            .IgnoreQueryFilters()
            .Where(c => c.TenantId == _currentUser.TenantId.Value)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .Select(c => new InventoryCategoryDto
            {
                CategoryId = c.CategoryId,
                Name = c.Name,
                Description = c.Description,
                DisplayOrder = c.DisplayOrder,
                IsActive = c.IsActive,
                IsDeleted = c.IsDeleted,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return Ok(rows);
    }

    [HttpPost("inventory-categories")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<InventoryCategoryDto>> CreateInventoryCategory([FromBody] CreateInventoryCategoryDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        try
        {
            ValidateLookupName(dto.Name, "Inventory category name is required.");

            var normalizedName = dto.Name.Trim();
            var exists = await _context.InventoryCategories.AnyAsync(c => c.Name == normalizedName);
            if (exists)
            {
                throw new InvalidOperationException("Inventory category already exists.");
            }

            var row = new InventoryCategory
            {
                TenantId = _currentUser.TenantId.Value,
                Name = normalizedName,
                Description = dto.Description,
                DisplayOrder = dto.DisplayOrder,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.InventoryCategories.Add(row);
            await _context.SaveChangesAsync();

            return Ok(new InventoryCategoryDto
            {
                CategoryId = row.CategoryId,
                Name = row.Name,
                Description = row.Description,
                DisplayOrder = row.DisplayOrder,
                IsActive = row.IsActive,
                IsDeleted = row.IsDeleted,
                CreatedAt = row.CreatedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("inventory-categories/{id:int}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<InventoryCategoryDto>> UpdateInventoryCategory(int id, [FromBody] CreateInventoryCategoryDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var row = await _context.InventoryCategories.FirstOrDefaultAsync(c => c.CategoryId == id);
        if (row == null)
        {
            return NotFound();
        }

        try
        {
            ValidateLookupName(dto.Name, "Inventory category name is required.");

            var normalizedName = dto.Name.Trim();
            var exists = await _context.InventoryCategories.AnyAsync(c => c.Name == normalizedName && c.CategoryId != id);
            if (exists)
            {
                throw new InvalidOperationException("Inventory category already exists.");
            }

            row.Name = normalizedName;
            row.Description = dto.Description;
            row.DisplayOrder = dto.DisplayOrder;
            row.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();

            return Ok(new InventoryCategoryDto
            {
                CategoryId = row.CategoryId,
                Name = row.Name,
                Description = row.Description,
                DisplayOrder = row.DisplayOrder,
                IsActive = row.IsActive,
                IsDeleted = row.IsDeleted,
                CreatedAt = row.CreatedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("inventory-categories/{id:int}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<IActionResult> DeleteInventoryCategory(int id)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var row = await _context.InventoryCategories.FirstOrDefaultAsync(c => c.CategoryId == id);
        if (row == null)
        {
            return NotFound();
        }

        var hasItems = await _context.Items.AnyAsync(i => i.InventoryCategoryId == id);
        if (hasItems)
        {
            return BadRequest(new { message = "Cannot delete inventory category while items are still using it." });
        }

        row.IsActive = false;
        row.IsDeleted = true;
        row.DeletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }


    [HttpGet("menu-categories")]
    public async Task<ActionResult<List<MenuCategoryDto>>> GetMenuCategories()
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var rows = await _context.MenuCategories
            .IgnoreQueryFilters()
            .Where(c => c.TenantId == _currentUser.TenantId.Value)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .Select(c => new MenuCategoryDto
            {
                CategoryId = c.CategoryId,
                Name = c.Name,
                DisplayOrder = c.DisplayOrder,
                IsActive = c.IsActive,
                IsDeleted = c.IsDeleted,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return Ok(rows);
    }

    [HttpPost("menu-categories")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<MenuCategoryDto>> CreateMenuCategory([FromBody] CreateMenuCategoryDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        try
        {
            ValidateLookupName(dto.Name, "Menu category name is required.");

            var normalizedName = dto.Name.Trim();
            var exists = await _context.MenuCategories.AnyAsync(c => c.Name == normalizedName);
            if (exists)
            {
                throw new InvalidOperationException("Menu category already exists.");
            }

            var row = new MenuCategory
            {
                TenantId = _currentUser.TenantId.Value,
                Name = normalizedName,
                DisplayOrder = dto.DisplayOrder,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.MenuCategories.Add(row);
            await _context.SaveChangesAsync();

            return Ok(new MenuCategoryDto
            {
                CategoryId = row.CategoryId,
                Name = row.Name,
                DisplayOrder = row.DisplayOrder,
                IsActive = row.IsActive,
                IsDeleted = row.IsDeleted,
                CreatedAt = row.CreatedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("menu-categories/{id:int}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<MenuCategoryDto>> UpdateMenuCategory(int id, [FromBody] CreateMenuCategoryDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var row = await _context.MenuCategories.FirstOrDefaultAsync(c => c.CategoryId == id);
        if (row == null)
        {
            return NotFound();
        }

        try
        {
            ValidateLookupName(dto.Name, "Menu category name is required.");

            var normalizedName = dto.Name.Trim();
            var exists = await _context.MenuCategories.AnyAsync(c => c.Name == normalizedName && c.CategoryId != id);
            if (exists)
            {
                throw new InvalidOperationException("Menu category already exists.");
            }

            row.Name = normalizedName;
            row.DisplayOrder = dto.DisplayOrder;
            row.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();

            return Ok(new MenuCategoryDto
            {
                CategoryId = row.CategoryId,
                Name = row.Name,
                DisplayOrder = row.DisplayOrder,
                IsActive = row.IsActive,
                IsDeleted = row.IsDeleted,
                CreatedAt = row.CreatedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("menu-categories/{id:int}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<IActionResult> DeleteMenuCategory(int id)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var row = await _context.MenuCategories.FirstOrDefaultAsync(c => c.CategoryId == id);
        if (row == null)
        {
            return NotFound();
        }

        var hasMenuItems = await _context.MenuItems.AnyAsync(m => m.CategoryId == id);
        if (hasMenuItems)
        {
            return BadRequest(new { message = "Cannot delete menu category while menu items are still using it." });
        }

        row.IsActive = false;
        row.IsDeleted = true;
        row.DeletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("menu-tags")]
    public async Task<ActionResult<List<MenuTagDto>>> GetMenuTags()
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var rows = await _context.MenuTags
            .IgnoreQueryFilters()
            .Where(c => c.TenantId == _currentUser.TenantId.Value)
            .OrderBy(c => c.Name)
            .Select(t => new MenuTagDto
            {
                TagId = t.TagId,
                Name = t.Name,
                Color = t.Color,
                IsActive = t.IsActive,
                IsDeleted = t.IsDeleted,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return Ok(rows);
    }

    [HttpPost("menu-tags")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<MenuTagDto>> CreateMenuTag([FromBody] CreateMenuTagDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        try
        {
            ValidateLookupName(dto.Name, "Menu tag name is required.");

            if (!string.IsNullOrWhiteSpace(dto.Color) && dto.Color.Trim().Length > 7)
            {
                throw new InvalidOperationException("Color must be a valid short HEX value.");
            }

            var normalizedName = dto.Name.Trim();
            var exists = await _context.MenuTags.AnyAsync(t => t.Name == normalizedName);
            if (exists)
            {
                throw new InvalidOperationException("Menu tag already exists.");
            }

            var row = new MenuTag
            {
                TenantId = _currentUser.TenantId.Value,
                Name = normalizedName,
                Color = string.IsNullOrWhiteSpace(dto.Color) ? null : dto.Color.Trim(),
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.MenuTags.Add(row);
            await _context.SaveChangesAsync();

            return Ok(new MenuTagDto
            {
                TagId = row.TagId,
                Name = row.Name,
                Color = row.Color,
                IsActive = row.IsActive,
                IsDeleted = row.IsDeleted,
                CreatedAt = row.CreatedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("menu-tags/{id:int}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<MenuTagDto>> UpdateMenuTag(int id, [FromBody] CreateMenuTagDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var row = await _context.MenuTags.FirstOrDefaultAsync(t => t.TagId == id);
        if (row == null)
        {
            return NotFound();
        }

        try
        {
            ValidateLookupName(dto.Name, "Menu tag name is required.");

            if (!string.IsNullOrWhiteSpace(dto.Color) && dto.Color.Trim().Length > 7)
            {
                throw new InvalidOperationException("Color must be a valid short HEX value.");
            }

            var normalizedName = dto.Name.Trim();
            var exists = await _context.MenuTags.AnyAsync(t => t.Name == normalizedName && t.TagId != id);
            if (exists)
            {
                throw new InvalidOperationException("Menu tag already exists.");
            }

            row.Name = normalizedName;
            row.Color = string.IsNullOrWhiteSpace(dto.Color) ? null : dto.Color.Trim();
            row.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();

            return Ok(new MenuTagDto
            {
                TagId = row.TagId,
                Name = row.Name,
                Color = row.Color,
                IsActive = row.IsActive,
                IsDeleted = row.IsDeleted,
                CreatedAt = row.CreatedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("menu-tags/{id:int}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<IActionResult> DeleteMenuTag(int id)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var row = await _context.MenuTags.FirstOrDefaultAsync(t => t.TagId == id);
        if (row == null)
        {
            return NotFound();
        }

        var hasAssignments = await _context.MenuItemTags.AnyAsync(t => t.TagId == id);
        if (hasAssignments)
        {
            return BadRequest(new { message = "Cannot delete menu tag while menu items are still using it." });
        }

        row.IsActive = false;
        row.IsDeleted = true;
        row.DeletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static void ValidateLookupName(string value, string message)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException(message);
        }
    }
}
