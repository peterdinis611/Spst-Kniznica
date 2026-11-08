namespace BookingService.Exceptions;

public class AppValidationException : Exception
{
    public IReadOnlyDictionary<string, string[]> Errors { get; }

    public AppValidationException(string message)
        : this(message, new Dictionary<string, string[]> { ["error"] = [message] })
    {
    }

    public AppValidationException(IDictionary<string, string[]> errors)
        : this("One or more validation errors occurred.", errors)
    {
    }

    public AppValidationException(string message, IDictionary<string, string[]> errors)
        : base(message)
    {
        Errors = new Dictionary<string, string[]>(errors, StringComparer.OrdinalIgnoreCase);
    }
}
