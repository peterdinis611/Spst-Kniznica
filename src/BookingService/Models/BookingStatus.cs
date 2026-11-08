namespace BookingService.Models;

public enum BookingStatus
{
    Reserved = 0,
    Active = 1,
    Returned = 2,
    Cancelled = 3,
    Overdue = 4
}
