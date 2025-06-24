import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb-utils';
import { v2 as cloudinary } from 'cloudinary';
import { ObjectId } from 'mongodb';

// Best_Practices.md: Typed API, robust feedback, minimal payloads, error handling, timeline logging
// Design_Prompts: Modular, accessible, secure, robust UI feedback

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    // 1. Parse multipart/form-data (Best_Practices.md: robust error handling)
    const formData = await req.formData();
    const file = formData.get('avatar');
    let userId = formData.get('userId');
    if (!userId) {
      const url = new URL(req.url);
      userId = url.searchParams.get('id');
    }
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        folder: 'avatars',
        resource_type: 'image',
        transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face' }],
      }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }).end(buffer);
    });
    // @ts-ignore
    const secureUrl = uploadResult.secure_url;
    if (!secureUrl) {
      return NextResponse.json({ error: 'Cloudinary upload failed' }, { status: 500 });
    }

    // 3. Update user in DB (Best_Practices.md: minimal payload)
    const usersCol = await getCollection('users');
    await usersCol.updateOne({ _id: new ObjectId(userId.toString()) }, { $set: { avatarUrl: secureUrl } });

    // 4. Return new avatar URL
    return NextResponse.json({ avatarUrl: secureUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}
