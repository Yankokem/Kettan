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
            .Select(c => MapCourier(c))
            .ToListAsync();

        return Ok(rows);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CourierDto>> GetCourier(int id)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var row = await _context.Couriers.FirstOrDefaultAsync(c => c.CourierId == id);
        if (row == null)
        {
            return NotFound();
        }

        return Ok(MapCourier(row));
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

            return Ok(MapCourier(courier));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<CourierDto>> UpdateCourier(int id, [FromBody] UpdateCourierDto dto)
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

        try
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                throw new InvalidOperationException("Courier name is required.");
            }

            var name = dto.Name.Trim();
            var exists = await _context.Couriers.AnyAsync(c => c.Name == name && c.CourierId != id);
            if (exists)
            {
                throw new InvalidOperationException("Courier already exists.");
            }

            courier.Name = name;
            courier.ContactNumber = dto.ContactNumber;
            courier.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();

            return Ok(MapCourier(courier));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<IActionResult> DeleteCourier(int id)
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

        var hasVehicles = await _context.Vehicles.AnyAsync(v => v.CourierId == id);
        if (hasVehicles)
        {
            return BadRequest(new { message = "Cannot delete courier while vehicles are still assigned." });
        }

        courier.IsActive = false;
        courier.IsDeleted = true;
        courier.DeletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
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
            .Select(v => MapVehicle(v))
            .ToListAsync();

        return Ok(rows);
    }

    [HttpGet("/api/vehicles")]
    public async Task<ActionResult<List<VehicleDto>>> GetVehicles(
        [FromQuery] int? courierId = null,
        [FromQuery] bool includeInactive = false)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var query = _context.Vehicles
            .Include(v => v.Courier)
            .AsQueryable();

        if (courierId.HasValue)
        {
            query = query.Where(v => v.CourierId == courierId.Value);
        }

        if (!includeInactive)
        {
            query = query.Where(v => v.IsActive);
        }

        var rows = await query
            .OrderBy(v => v.PlateNumber)
            .Select(v => MapVehicle(v))
            .ToListAsync();

        return Ok(rows);
    }

    [HttpGet("/api/vehicles/{id:int}")]
    public async Task<ActionResult<VehicleDto>> GetVehicle(int id)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var row = await _context.Vehicles
            .Include(v => v.Courier)
            .FirstOrDefaultAsync(v => v.VehicleId == id);

        if (row == null)
        {
            return NotFound();
        }

        return Ok(MapVehicle(row));
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

            vehicle.Courier = courier;
            return Ok(MapVehicle(vehicle));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("/api/vehicles/{id:int}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<VehicleDto>> UpdateVehicle(int id, [FromBody] UpdateVehicleDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var vehicle = await _context.Vehicles
            .Include(v => v.Courier)
            .FirstOrDefaultAsync(v => v.VehicleId == id);

        if (vehicle == null)
        {
            return NotFound();
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

            var courier = await _context.Couriers.FirstOrDefaultAsync(c => c.CourierId == dto.CourierId);
            if (courier == null)
            {
                throw new InvalidOperationException("Courier was not found.");
            }

            var normalizedPlate = dto.PlateNumber.Trim().ToUpperInvariant();
            var duplicatePlate = await _context.Vehicles.AnyAsync(v => v.PlateNumber == normalizedPlate && v.VehicleId != id);
            if (duplicatePlate)
            {
                throw new InvalidOperationException("Vehicle plate number already exists.");
            }

            vehicle.CourierId = dto.CourierId;
            vehicle.PlateNumber = normalizedPlate;
            vehicle.VehicleType = dto.VehicleType.Trim();
            vehicle.Description = dto.Description;
            vehicle.IsActive = dto.IsActive;
            vehicle.Courier = courier;

            await _context.SaveChangesAsync();

            return Ok(MapVehicle(vehicle));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("/api/vehicles/{id:int}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<IActionResult> DeleteVehicle(int id)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.VehicleId == id);
        if (vehicle == null)
        {
            return NotFound();
        }

        vehicle.IsActive = false;
        vehicle.IsDeleted = true;
        vehicle.DeletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static CourierDto MapCourier(Courier courier)
    {
        return new CourierDto
        {
            CourierId = courier.CourierId,
            TenantId = courier.TenantId,
            Name = courier.Name,
            ContactNumber = courier.ContactNumber,
            IsActive = courier.IsActive,
            CreatedAt = courier.CreatedAt
        };
    }

    private static VehicleDto MapVehicle(Vehicle vehicle)
    {
        return new VehicleDto
        {
            VehicleId = vehicle.VehicleId,
            TenantId = vehicle.TenantId,
            CourierId = vehicle.CourierId,
            CourierName = vehicle.Courier != null ? vehicle.Courier.Name : string.Empty,
            PlateNumber = vehicle.PlateNumber,
            VehicleType = vehicle.VehicleType,
            Description = vehicle.Description,
            IsActive = vehicle.IsActive,
            CreatedAt = vehicle.CreatedAt
        };
    }
}
