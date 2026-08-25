import { createUploadthing, type FileRouter, UploadThingError } from 'uploadthing/server';
import { COVER_MAX_BYTES, coverFileFault } from '$lib/cover-upload';
import { deskUploader } from '$lib/server/upload-auth';

const f = createUploadthing();

const coverLimit = { maxFileSize: '4MB', maxFileCount: 1 } as const;

export const ourFileRouter = {
	bookCover: f({
		'image/jpeg': coverLimit,
		'image/png': coverLimit,
		'image/webp': coverLimit
	})
		.middleware(async ({ req, files }) => {
			const user = await deskUploader(req);
			if (!user) {
				throw new UploadThingError({
					code: 'FORBIDDEN',
					message: 'Pult je len pre správu fondu.'
				});
			}

			const file = files[0];
			const fault = coverFileFault(file);
			if (fault) {
				throw new UploadThingError({
					code: (file?.size ?? 0) > COVER_MAX_BYTES ? 'TOO_LARGE' : 'BAD_REQUEST',
					message: fault
				});
			}

			return { userId: user.id };
		})
		.onUploadComplete(async ({ file }) => {
			return { url: file.ufsUrl, key: file.key };
		})
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
