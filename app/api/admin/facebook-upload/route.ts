
import { randomUUID } from 'node:crypto';
import { requireAdmin, failure } from '../../../lib/facebook-autopost';

export const runtime = 'nodejs';

const BUCKET = 'ads-media';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 90 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
};

export async function POST(request: Request) {
  try {
    // Vérification des droits administrateur
    const db = await requireAdmin(request);

    // Lecture du fichier
    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return Response.json(
        { error: 'Aucun fichier sélectionné.' },
        { status: 400 }
      );
    }

    const extension = ALLOWED_TYPES[file.type];

    if (!extension) {
      return Response.json(
        {
          error:
            'Format non accepté. Utilisez JPG, PNG, WebP, MP4 ou MOV.',
        },
        { status: 400 }
      );
    }

    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo
      ? MAX_VIDEO_SIZE
      : MAX_IMAGE_SIZE;

    if (file.size === 0) {
      return Response.json(
        { error: 'Le fichier est vide.' },
        { status: 400 }
      );
    }

    if (file.size > maxSize) {
      return Response.json(
        {
          error: `Fichier trop volumineux. Maximum ${
            isVideo ? '90 Mo' : '10 Mo'
          }.`,
        },
        { status: 413 }
      );
    }

    // Nom unique pour éviter les conflits
    const fileName = `facebook/${Date.now()}-${randomUUID()}.${extension}`;

    const bytes = new Uint8Array(await file.arrayBuffer());

    // Importation dans Supabase Storage
    const { data, error } = await db.storage
      .from(BUCKET)
      .upload(fileName, bytes, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600',
      });

    if (error) {
      console.error('Facebook upload Storage:', error.message);

      return Response.json(
        {
          error: `Erreur Supabase Storage : ${error.message}`,
        },
        { status: 500 }
      );
    }

    // URL publique accessible par Facebook
    const { data: publicData } = db.storage
      .from(BUCKET)
      .getPublicUrl(data.path);

    const url = publicData.publicUrl;

    if (!url || !url.startsWith('https://')) {
      return Response.json(
        {
          error: "Impossible de générer l'URL publique.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      url,
      media_type: isVideo ? 'video' : 'image',
      file_name: file.name,
      path: data.path,
    });
  } catch (error) {
    console.error('Facebook upload:', error);
    return failure(error);
  }
}
