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
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .Select(c => new ItemCategoryDto
            {
                ItemCategoryId = c.ItemCategoryId,
                Name = c.Name,
                Description = c.Description,
                DisplayOrder = c.DisplayOrder,
                IsActive = c.IsActive,
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
                CreatedAt = row.CreatedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("inventory-categories")]
    public async Task<ActionResult<List<InventoryCategoryDto>>> GetInventoryCategories()
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var rows = await _context.InventoryCategories
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .Select(c => new InventoryCategoryDto
            {
                CategoryId = c.CategoryId,
                Name = c.Name,
                Description = c.Description,
                DisplayOrder = c.DisplayOrder,
                IsActive = c.IsActive,
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
                CreatedAt = row.CreatedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("units")]
    public async Task<ActionResult<List<UnitDto>>> GetUnits()
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var rows = await _context.Units
            .OrderBy(u => u.Name)
            .Select(u => new UnitDto
            {
                UnitId = u.UnitId,
                Name = u.Name,
                Symbol = u.Symbol,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(rows);
    }

    [HttpPost("units")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<UnitDto>> CreateUnit([FromBody] CreateUnitDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        try
        {
            ValidateLookupName(dto.Name, "Unit name is required.");

            if (string.IsNullOrWhiteSpace(dto.Symbol))
            {
                throw new InvalidOperationException("Unit symbol is required.");
            }

            var normalizedName = dto.Name.Trim();
            var normalizedSymbol = dto.Symbol.Trim();

            if (normalizedName.Length > 50)
            {
                throw new InvalidOperationException("Unit name cannot exceed 50 characters.");
            }

            if (normalizedSymbol.Length > 10)
            {
                throw new InvalidOperationException("Unit symbol cannot exceed 10 characters.");
            }

            var exists = await _context.Units.AnyAsync(u => u.Name == normalizedName || u.Symbol == normalizedSymbol);
            if (exists)
            {
                throw new InvalidOperationException("Unit already exists.");
            }

            var row = new Unit
            {
                TenantId = _currentUser.TenantId.Value,
                Name = normalizedName,
                Symbol = normalizedSymbol,
                CreatedAt = DateTime.UtcNow
            };

            _context.Units.Add(row);
            await _context.SaveChangesAsync();

            return Ok(new UnitDto
            {
                UnitId = row.UnitId,
                Name = row.Name,
                Symbol = row.Symbol,
                CreatedAt = row.CreatedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("menu-categories")]
    public async Task<ActionResult<List<MenuCategoryDto>>> GetMenuCategories()
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var rows = await _context.MenuCategories
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .Select(c => new MenuCategoryDto
            {
                CategoryId = c.CategoryId,
                Name = c.Name,
                DisplayOrder = c.DisplayOrder,
                IsActive = c.IsActive,
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
                CreatedAt = row.CreatedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("menu-tags")]
    public async Task<ActionResult<List<MenuTagDto>>> GetMenuTags()
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var rows = await _context.MenuTags
            .OrderBy(t => t.Name)
            .Select(t => new MenuTagDto
            {
                TagId = t.TagId,
                Name = t.Name,
                Color = t.Color,
                IsActive = t.IsActive,
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
                CreatedAt = row.CreatedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private static void ValidateLookupName(string value, string message)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException(message);
        }
    }
}
