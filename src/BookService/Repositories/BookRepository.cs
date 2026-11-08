using BookService.Data;
using BookService.Models;
using Microsoft.EntityFrameworkCore;

namespace BookService.Repositories;

public class BookRepository(BookDbContext db) : IBookRepository
{
    public async Task<IReadOnlyList<Book>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await db.Books
            .AsNoTracking()
            .OrderBy(b => b.Title)
            .ToListAsync(cancellationToken);
    }

    public Task<Book?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return db.Books
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public async Task<Book> AddAsync(Book book, CancellationToken cancellationToken = default)
    {
        db.Books.Add(book);
        await db.SaveChangesAsync(cancellationToken);
        return book;
    }

    public async Task<Book?> UpdateAsync(Guid id, Book updated, CancellationToken cancellationToken = default)
    {
        var book = await db.Books.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (book is null)
        {
            return null;
        }

        book.Title = updated.Title;
        book.Author = updated.Author;
        book.Isbn = updated.Isbn;
        book.PublishedYear = updated.PublishedYear;

        await db.SaveChangesAsync(cancellationToken);
        return book;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var book = await db.Books.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (book is null)
        {
            return false;
        }

        db.Books.Remove(book);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public Task<bool> IsbnExistsAsync(string isbn, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = db.Books.AsNoTracking().Where(b => b.Isbn == isbn);
        if (excludeId.HasValue)
        {
            query = query.Where(b => b.Id != excludeId.Value);
        }

        return query.AnyAsync(cancellationToken);
    }
}
