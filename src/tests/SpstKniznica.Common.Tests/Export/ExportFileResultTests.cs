using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SpstKniznica.Common.Export;

namespace SpstKniznica.Common.Tests.Export;

public class ExportFileResultTests
{
    [Theory]
    [InlineData(ExportFormat.Csv, "text/csv", ".csv")]
    [InlineData(ExportFormat.Xml, "application/xml", ".xml")]
    [InlineData(ExportFormat.Xlsx, "spreadsheetml.sheet", ".xlsx")]
    [InlineData(ExportFormat.Pdf, "application/pdf", ".pdf")]
    public void Create_sets_content_type_filename_and_no_store_headers(
        ExportFormat format,
        string contentTypeFragment,
        string extension)
    {
        var httpContext = new DefaultHttpContext();
        var controller = new StubController
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };

        var result = ExportFileResult.Create(
            controller,
            format,
            "books export!",
            ["title", "author"],
            [["Kniha", "Autor"], ["=1+1", "X"]],
            "books",
            "book");

        result.Should().BeOfType<FileContentResult>();
        result.ContentType.Should().Contain(contentTypeFragment);
        result.FileDownloadName.Should().EndWith(extension);
        result.FileDownloadName.Should().StartWith("books-export");
        result.FileContents.Length.Should().BeGreaterThan(8);

        httpContext.Response.Headers.CacheControl.ToString().Should().Contain("no-store");
        httpContext.Response.Headers["X-Content-Type-Options"].ToString().Should().Be("nosniff");
    }

    private sealed class StubController : ControllerBase;
}
