namespace SpstKniznica.Common.Pagination;

/// <summary>
/// Opaque cursor around a stable entity id (GUID).
/// Accepts base64url(guid-bytes) or a plain GUID string.
/// </summary>
public static class CursorCodec
{
    public static string Encode(Guid id)
    {
        var base64 = Convert.ToBase64String(id.ToByteArray());
        return base64.TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    public static bool TryDecode(string? cursor, out Guid id)
    {
        id = default;
        if (string.IsNullOrWhiteSpace(cursor))
        {
            return false;
        }

        var value = cursor.Trim();
        if (Guid.TryParse(value, out id))
        {
            return true;
        }

        try
        {
            var padded = value.Replace('-', '+').Replace('_', '/');
            switch (padded.Length % 4)
            {
                case 2:
                    padded += "==";
                    break;
                case 3:
                    padded += "=";
                    break;
            }

            var bytes = Convert.FromBase64String(padded);
            if (bytes.Length != 16)
            {
                return false;
            }

            id = new Guid(bytes);
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
        catch (ArgumentException)
        {
            return false;
        }
    }
}
