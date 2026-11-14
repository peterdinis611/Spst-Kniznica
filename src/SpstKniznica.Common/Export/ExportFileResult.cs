using Microsoft.AspNetCore.Mvc;

namespace SpstKniznica.Common.Export;

public static class ExportFileResult
{
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

        byte[] bytes;
        string contentType;
        string fileName;

        if (format == ExportFormat.Xml)
        {
            bytes = SecureTabularExport.ToXml(xmlRoot, xmlRow, headers, rows);
            contentType = "application/xml; charset=utf-8";
            fileName = $"{safeStem}-{stamp}.xml";
        }
        else
        {
            bytes = SecureTabularExport.ToCsv(headers, rows);
            contentType = "text/csv; charset=utf-8";
            fileName = $"{safeStem}-{stamp}.csv";
        }

        controller.Response.Headers.CacheControl = "no-store, no-cache, must-revalidate";
        controller.Response.Headers.Pragma = "no-cache";
        controller.Response.Headers["X-Content-Type-Options"] = "nosniff";

        return controller.File(bytes, contentType, fileName);
    }
}
