using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class MenuItemTag
{
    public int MenuItemId { get; set; }

    [ForeignKey(nameof(MenuItemId))]
    public MenuItem? MenuItem { get; set; }

    public int TagId { get; set; }

    [ForeignKey(nameof(TagId))]
    public MenuTag? Tag { get; set; }
}
