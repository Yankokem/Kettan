using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Employees;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/employees")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public EmployeesController(ApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<List<EmployeeDto>>> GetEmployees([FromQuery] int? branchId = null)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var query = _context.Employees
            .Include(e => e.Branch)
            .AsQueryable();

        if (_currentUser.BranchId.HasValue)
        {
            query = query.Where(e => e.BranchId == _currentUser.BranchId.Value);
        }
        else if (branchId.HasValue)
        {
            query = query.Where(e => e.BranchId == branchId.Value);
        }

        var rows = await query
            .OrderBy(e => e.LastName)
            .ThenBy(e => e.FirstName)
            .ToListAsync();

        return Ok(rows.Select(MapEmployee).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EmployeeDto>> GetEmployee(int id)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var employee = await _context.Employees
            .Include(e => e.Branch)
            .FirstOrDefaultAsync(e => e.EmployeeId == id);

        if (employee == null)
        {
            return NotFound();
        }

        if (_currentUser.BranchId.HasValue && employee.BranchId != _currentUser.BranchId.Value)
        {
            return Forbid();
        }

        return Ok(MapEmployee(employee));
    }

    [HttpPost]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff,BranchOwner,BranchManager")]
    public async Task<ActionResult<EmployeeDto>> CreateEmployee([FromBody] CreateEmployeeDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        try
        {
            var resolvedBranchId = await ResolveBranchIdAsync(dto.BranchId);
            ValidateEmployeePayload(dto.FirstName, dto.LastName, dto.Position);

            var employee = new Employee
            {
                TenantId = _currentUser.TenantId.Value,
                BranchId = resolvedBranchId,
                FirstName = dto.FirstName.Trim(),
                LastName = dto.LastName.Trim(),
                Position = dto.Position.Trim(),
                ContactNumber = dto.ContactNumber,
                DateHired = dto.DateHired,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();

            var row = await _context.Employees
                .Include(e => e.Branch)
                .FirstOrDefaultAsync(e => e.EmployeeId == employee.EmployeeId);

            if (row == null)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Employee was created but could not be loaded." });
            }

            return CreatedAtAction(nameof(GetEmployee), new { id = row.EmployeeId }, MapEmployee(row));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff,BranchOwner,BranchManager")]
    public async Task<IActionResult> UpdateEmployee(int id, [FromBody] UpdateEmployeeDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == id);
        if (employee == null)
        {
            return NotFound();
        }

        if (_currentUser.BranchId.HasValue && employee.BranchId != _currentUser.BranchId.Value)
        {
            return Forbid();
        }

        try
        {
            var resolvedBranchId = await ResolveBranchIdAsync(dto.BranchId);
            ValidateEmployeePayload(dto.FirstName, dto.LastName, dto.Position);

            employee.BranchId = resolvedBranchId;
            employee.FirstName = dto.FirstName.Trim();
            employee.LastName = dto.LastName.Trim();
            employee.Position = dto.Position.Trim();
            employee.ContactNumber = dto.ContactNumber;
            employee.DateHired = dto.DateHired;
            employee.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private async Task<int?> ResolveBranchIdAsync(int? requestedBranchId)
    {
        var branchId = _currentUser.BranchId ?? requestedBranchId;

        if (_currentUser.BranchId.HasValue && requestedBranchId.HasValue && requestedBranchId.Value != _currentUser.BranchId.Value)
        {
            throw new InvalidOperationException("Branch users can only assign employees to their own branch.");
        }

        if (!branchId.HasValue)
        {
            return null;
        }

        var branchExists = await _context.Branches.AnyAsync(b => b.BranchId == branchId.Value && b.IsActive);
        if (!branchExists)
        {
            throw new InvalidOperationException("Branch was not found.");
        }

        return branchId;
    }

    private static void ValidateEmployeePayload(string firstName, string lastName, string position)
    {
        if (string.IsNullOrWhiteSpace(firstName))
        {
            throw new InvalidOperationException("First name is required.");
        }

        if (string.IsNullOrWhiteSpace(lastName))
        {
            throw new InvalidOperationException("Last name is required.");
        }

        if (string.IsNullOrWhiteSpace(position))
        {
            throw new InvalidOperationException("Position is required.");
        }
    }

    private static EmployeeDto MapEmployee(Employee employee)
    {
        return new EmployeeDto
        {
            EmployeeId = employee.EmployeeId,
            TenantId = employee.TenantId,
            BranchId = employee.BranchId,
            BranchName = employee.Branch?.Name,
            FirstName = employee.FirstName,
            LastName = employee.LastName,
            Position = employee.Position,
            ContactNumber = employee.ContactNumber,
            DateHired = employee.DateHired,
            IsActive = employee.IsActive,
            CreatedAt = employee.CreatedAt
        };
    }
}
