using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Suppliers;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/suppliers")]
[Authorize]
public class SuppliersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public SuppliersController(ApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<List<SupplierDto>>> GetSuppliers([FromQuery] bool includeInactive = false)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var query = _context.Suppliers.AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(s => s.IsActive);
        }

        var rows = await query
            .OrderBy(s => s.Name)
            .Select(s => MapSupplier(s))
            .ToListAsync();

        return Ok(rows);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SupplierDto>> GetSupplier(int id)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var row = await _context.Suppliers.FirstOrDefaultAsync(s => s.SupplierId == id);

        if (row == null)
        {
            return NotFound();
        }

        return Ok(MapSupplier(row));
    }

    [HttpPost]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<SupplierDto>> CreateSupplier([FromBody] CreateSupplierDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        try
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                throw new InvalidOperationException("Name is required.");
            }

            var normalizedName = dto.Name.Trim();
            var duplicate = await _context.Suppliers.AnyAsync(s => s.Name == normalizedName);
            if (duplicate)
            {
                throw new InvalidOperationException("Supplier name already exists.");
            }

            var supplier = new Supplier
            {
                TenantId = _currentUser.TenantId.Value,
                Name = normalizedName,
                ContactPerson = dto.ContactPerson?.Trim(),
                Email = dto.Email?.Trim(),
                Phone = dto.Phone?.Trim(),
                Address = dto.Address?.Trim(),
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync();

            return Ok(MapSupplier(supplier));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<SupplierDto>> UpdateSupplier(int id, [FromBody] UpdateSupplierDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.SupplierId == id);

        if (supplier == null)
        {
            return NotFound();
        }

        try
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                throw new InvalidOperationException("Name is required.");
            }

            var normalizedName = dto.Name.Trim();
            var duplicate = await _context.Suppliers.AnyAsync(s => s.Name == normalizedName && s.SupplierId != id);
            if (duplicate)
            {
                throw new InvalidOperationException("Supplier name already exists.");
            }

            supplier.Name = normalizedName;
            supplier.ContactPerson = dto.ContactPerson?.Trim();
            supplier.Email = dto.Email?.Trim();
            supplier.Phone = dto.Phone?.Trim();
            supplier.Address = dto.Address?.Trim();
            supplier.IsActive = dto.IsActive;
            supplier.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(MapSupplier(supplier));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<IActionResult> DeleteSupplier(int id)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.SupplierId == id);
        if (supplier == null)
        {
            return NotFound();
        }

        // Check if any items are using this supplier
        var inUse = await _context.Items.AnyAsync(i => i.SupplierId == id);
        if (inUse)
        {
            return BadRequest(new { message = "Supplier cannot be deleted because it is in use by inventory items." });
        }

        supplier.IsActive = false;
        supplier.IsDeleted = true;
        supplier.DeletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static SupplierDto MapSupplier(Supplier supplier)
    {
        return new SupplierDto
        {
            SupplierId = supplier.SupplierId,
            TenantId = supplier.TenantId,
            Name = supplier.Name,
            ContactPerson = supplier.ContactPerson,
            Email = supplier.Email,
            Phone = supplier.Phone,
            Address = supplier.Address,
            IsActive = supplier.IsActive,
            CreatedAt = supplier.CreatedAt
        };
    }
}
