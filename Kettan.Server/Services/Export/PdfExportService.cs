using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Kettan.Server.Services.Export;

public class PdfExportService : IPdfExportService
{
    public PdfExportService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] ExportToPdf<T>(string title, IEnumerable<T> records)
    {
        var properties = typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance);
        var recordList = records.ToList();

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Element(c => ComposeHeader(c, title));
                page.Content().Element(c => ComposeContent(c, properties, recordList));
                page.Footer().Element(ComposeFooter);
            });
        });

        return document.GeneratePdf();
    }

    private static void ComposeHeader(IContainer container, string title)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(column =>
            {
                column.Item().Text(title).FontSize(20).SemiBold().FontColor(Colors.Blue.Darken2);
                column.Item().Text($"Generated on {DateTime.Now:yyyy-MM-dd HH:mm}").FontSize(10).FontColor(Colors.Grey.Medium);
            });
        });
    }

    private static void ComposeContent<T>(IContainer container, PropertyInfo[] properties, List<T> records)
    {
        container.PaddingVertical(1, Unit.Centimetre).Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                for (int i = 0; i < properties.Length; i++)
                {
                    columns.RelativeColumn();
                }
            });

            table.Header(header =>
            {
                foreach (var prop in properties)
                {
                    header.Cell().Element(CellStyle).Text(prop.Name).SemiBold();
                }

                static IContainer CellStyle(IContainer c)
                {
                    return c.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
                }
            });

            foreach (var record in records)
            {
                foreach (var prop in properties)
                {
                    var value = prop.GetValue(record)?.ToString() ?? string.Empty;
                    table.Cell().Element(CellStyle).Text(value);
                }
            }

            static IContainer CellStyle(IContainer c)
            {
                return c.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5);
            }
        });
    }

    private static void ComposeFooter(IContainer container)
    {
        container.AlignCenter().Text(x =>
        {
            x.Span("Page ");
            x.CurrentPageNumber();
            x.Span(" of ");
            x.TotalPages();
        });
    }
}
