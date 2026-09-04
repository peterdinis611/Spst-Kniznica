import { asc } from 'drizzle-orm';
import { db } from '../db';
import { author, book, category, user } from '../db/schema';

export async function categoryOptions() {
	return await db
		.select({ id: category.id, name: category.name, code: category.code })
		.from(category)
		.orderBy(asc(category.sortOrder), asc(category.name));
}

export async function authorOptions() {
	return await db
		.select({ id: author.id, name: author.name })
		.from(author)
		.orderBy(asc(author.name));
}

export async function bookOptions() {
	return await db
		.select({ id: book.id, title: book.title, callNumber: book.callNumber })
		.from(book)
		.orderBy(asc(book.title));
}

export async function readerOptions() {
	return await db
		.select({ id: user.id, name: user.name, email: user.email })
		.from(user)
		.orderBy(asc(user.name));
}
