using System.Collections.Generic;

namespace Kettan.Server.Services.Export;

public interface IPdfExportService
{
    byte[] ExportToPdf<T>(string title, IEnumerable<T> records);
}
