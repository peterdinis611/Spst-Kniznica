import { createUploadthing, type FileRouter, UploadThingError } from 'uploadthing/server';
import { deskUploader } from '$lib/server/upload-auth';

const f = createUploadthing();

export const ourFileRouter = {
	bookCover: f({
		image: {
			maxFileSize: '4MB',
			maxFileCount: 1
		}
	})
		.middleware(async ({ req }) => {
			const user = await deskUploader(req);
			if (!user) throw new UploadThingError('Pult je len pre správu fondu.');
			return { userId: user.id };
		})
		.onUploadComplete(async ({ file }) => {
			return { url: file.ufsUrl, key: file.key };
		})
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
