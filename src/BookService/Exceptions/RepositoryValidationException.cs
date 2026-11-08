namespace BookService.Exceptions;

public class RepositoryValidationException : Exception
{
    public IReadOnlyDictionary<string, string[]> Errors { get; }

    public RepositoryValidationException(string message)
        : this(message, new Dictionary<string, string[]> { ["repository"] = [message] })
    {
    }

    public RepositoryValidationException(IDictionary<string, string[]> errors)
        : this("One or more repository validation errors occurred.", errors)
    {
    }

    public RepositoryValidationException(string message, IDictionary<string, string[]> errors)
        : base(message)
    {
        Errors = new Dictionary<string, string[]>(errors, StringComparer.OrdinalIgnoreCase);
    }
}
