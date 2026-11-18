using Microsoft.AspNetCore.Mvc;

namespace SpstKniznica.Common.Export;

public static class ExportFileResult
{
    public const string CsvContentType = "text/csv; charset=utf-8";
    public const string XmlContentType = "application/xml; charset=utf-8";
    public const string XlsxContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    public const string PdfContentType = "application/pdf";

    public static FileContentResult Create(
        ControllerBase controller,
        ExportFormat format,
        string fileStem,
        IReadOnlyList<string> headers,
        IEnumerable<IReadOnlyList<string?>> rows,
        string xmlRoot,
        string xmlRow)
    {
        var safeStem = SecureTabularExport.SanitizeFileName(fileStem);
        var stamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss");
        var materialised = rows as IReadOnlyList<IReadOnlyList<string?>> ?? rows.ToList();

        byte[] bytes;
        string contentType;
        string fileName;

        switch (format)
        {
            case ExportFormat.Xml:
                bytes = SecureTabularExport.ToXml(xmlRoot, xmlRow, headers, materialised);
                contentType = XmlContentType;
                fileName = $"{safeStem}-{stamp}.xml";
                break;
            case ExportFormat.Xlsx:
                bytes = SecureTabularExport.ToXlsx(safeStem, headers, materialised);
                contentType = XlsxContentType;
                fileName = $"{safeStem}-{stamp}.xlsx";
                break;
            case ExportFormat.Pdf:
                bytes = SecureTabularExport.ToPdf(safeStem, headers, materialised);
                contentType = PdfContentType;
                fileName = $"{safeStem}-{stamp}.pdf";
                break;
            default:
                bytes = SecureTabularExport.ToCsv(headers, materialised);
                contentType = CsvContentType;
                fileName = $"{safeStem}-{stamp}.csv";
                break;
        }

        controller.Response.Headers.CacheControl = "no-store, no-cache, must-revalidate";
        controller.Response.Headers.Pragma = "no-cache";
        controller.Response.Headers["X-Content-Type-Options"] = "nosniff";

        return controller.File(bytes, contentType, fileName);
    }
}
