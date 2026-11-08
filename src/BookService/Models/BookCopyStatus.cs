namespace BookService.Models;

public enum BookCopyStatus
{
    Available = 0,
    Borrowed = 1,
    Reserved = 2,
    Lost = 3,
    Maintenance = 4
}
