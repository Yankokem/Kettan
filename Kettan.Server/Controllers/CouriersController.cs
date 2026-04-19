using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Couriers;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/couriers")]
[Authorize]
public class CouriersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CouriersController(ApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<List<CourierDto>>> GetCouriers([FromQuery] bool includeInactive = false)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var query = _context.Couriers.AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(c => c.IsActive);
        }

        var rows = await query
            .OrderBy(c => c.Name)
            .Select(c => new CourierDto
            {
                CourierId = c.CourierId,
                TenantId = c.TenantId,
                Name = c.Name,
                ContactNumber = c.ContactNumber,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return Ok(rows);
    }

    [HttpPost]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<CourierDto>> CreateCourier([FromBody] CreateCourierDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        try
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                throw new InvalidOperationException("Courier name is required.");
            }

            var name = dto.Name.Trim();
            var exists = await _context.Couriers.AnyAsync(c => c.Name == name);
            if (exists)
            {
                throw new InvalidOperationException("Courier already exists.");
            }

            var courier = new Courier
            {
                TenantId = _currentUser.TenantId.Value,
                Name = name,
                ContactNumber = dto.ContactNumber,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.Couriers.Add(courier);
            await _context.SaveChangesAsync();

            return Ok(new CourierDto
            {
                CourierId = courier.CourierId,
                TenantId = courier.TenantId,
                Name = courier.Name,
                ContactNumber = courier.ContactNumber,
                IsActive = courier.IsActive,
                CreatedAt = courier.CreatedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id:int}/vehicles")]
    public async Task<ActionResult<List<VehicleDto>>> GetCourierVehicles(int id)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var courier = await _context.Couriers.FirstOrDefaultAsync(c => c.CourierId == id);
        if (courier == null)
        {
            return NotFound();
        }

        var rows = await _context.Vehicles
            .Include(v => v.Courier)
            .Where(v => v.CourierId == id)
            .OrderBy(v => v.PlateNumber)
            .Select(v => new VehicleDto
            {
                VehicleId = v.VehicleId,
                TenantId = v.TenantId,
                CourierId = v.CourierId,
                CourierName = v.Courier != null ? v.Courier.Name : string.Empty,
                PlateNumber = v.PlateNumber,
                VehicleType = v.VehicleType,
                Description = v.Description,
                IsActive = v.IsActive,
                CreatedAt = v.CreatedAt
            })
            .ToListAsync();

        return Ok(rows);
    }

    [HttpPost("/api/vehicles")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<VehicleDto>> CreateVehicle([FromBody] CreateVehicleDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        try
        {
            if (string.IsNullOrWhiteSpace(dto.PlateNumber))
            {
                throw new InvalidOperationException("Plate number is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.VehicleType))
            {
                throw new InvalidOperationException("Vehicle type is required.");
            }

            var courier = await _context.Couriers.FirstOrDefaultAsync(c => c.CourierId == dto.CourierId && c.IsActive);
            if (courier == null)
            {
                throw new InvalidOperationException("Courier was not found.");
            }

            var normalizedPlate = dto.PlateNumber.Trim().ToUpperInvariant();
            var duplicatePlate = await _context.Vehicles.AnyAsync(v => v.PlateNumber == normalizedPlate);
            if (duplicatePlate)
            {
                throw new InvalidOperationException("Vehicle plate number already exists.");
            }

            var vehicle = new Vehicle
            {
                TenantId = _currentUser.TenantId.Value,
                CourierId = dto.CourierId,
                PlateNumber = normalizedPlate,
                VehicleType = dto.VehicleType.Trim(),
                Description = dto.Description,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();

            return Ok(new VehicleDto
            {
                VehicleId = vehicle.VehicleId,
                TenantId = vehicle.TenantId,
                CourierId = vehicle.CourierId,
                CourierName = courier.Name,
                PlateNumber = vehicle.PlateNumber,
                VehicleType = vehicle.VehicleType,
                Description = vehicle.Description,
                IsActive = vehicle.IsActive,
                CreatedAt = vehicle.CreatedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
