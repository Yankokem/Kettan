using System.Collections.Generic;
using System.Globalization;
using System.IO;
using CsvHelper;

namespace Kettan.Server.Services.Export;

public class CsvExportService : ICsvExportService
{
    public byte[] ExportToCsv<T>(IEnumerable<T> records)
    {
        using var memoryStream = new MemoryStream();
        using var streamWriter = new StreamWriter(memoryStream);
        using var csvWriter = new CsvWriter(streamWriter, CultureInfo.InvariantCulture);

        csvWriter.WriteRecords(records);
        streamWriter.Flush();

        return memoryStream.ToArray();
    }
}
