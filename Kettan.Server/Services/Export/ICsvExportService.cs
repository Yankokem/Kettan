using System.Collections.Generic;

namespace Kettan.Server.Services.Export;

public interface ICsvExportService
{
    byte[] ExportToCsv<T>(IEnumerable<T> records);
}
