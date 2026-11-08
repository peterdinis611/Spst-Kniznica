namespace BookService.Exceptions;

/// <summary>
/// Kept for backward compatibility; prefer <see cref="AppValidationException"/>.
/// </summary>
public class RepositoryValidationException : AppValidationException
{
    public RepositoryValidationException(string message) : base(message)
    {
    }

    public RepositoryValidationException(IDictionary<string, string[]> errors) : base(errors)
    {
    }

    public RepositoryValidationException(string message, IDictionary<string, string[]> errors)
        : base(message, errors)
    {
    }
}
