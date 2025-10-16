// Cloudinary configuration for React Native
const CLOUDINARY_CLOUD_NAME = 'dhvmumahy';
const CLOUDINARY_API_KEY = '992828929321838';

export const uploadToCloudinary = async (imageUri: string): Promise<string> => {
  try {
    console.log('Starting upload for:', imageUri);

    // Create FormData for upload
    const formData = new FormData();

    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `waste_${Date.now()}.jpg`,
    } as any);

    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('folder', 'waste_pickups');
    formData.append('upload_preset', 'waste_upload'); // Try a simple preset name

    console.log('FormData created, starting fetch...');

    // Upload to Cloudinary using direct API call
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    console.log('Fetch response status:', uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload response error:', errorText);

      // If preset doesn't exist, try without it (might work with API key)
      if (errorText.includes('preset') || uploadResponse.status === 400) {
        console.log('Trying without preset...');

        const simpleFormData = new FormData();
        simpleFormData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: `waste_${Date.now()}.jpg`,
        } as any);
        simpleFormData.append('api_key', CLOUDINARY_API_KEY);
        simpleFormData.append('folder', 'waste_pickups');

        const retryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: simpleFormData,
          }
        );

        if (!retryResponse.ok) {
          const retryErrorText = await retryResponse.text();
          console.error('Retry upload failed:', retryErrorText);
          throw new Error(`Upload failed: ${retryResponse.status} - ${retryErrorText}`);
        }

        const retryResult = await retryResponse.json();
        if (retryResult.error) {
          throw new Error(retryResult.error.message || 'Upload failed');
        }

        console.log('Upload successful without preset:', retryResult.secure_url);
        return retryResult.secure_url;
      }

      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const result = await uploadResponse.json();
    console.log('Upload result:', result);

    if (result.error) {
      throw new Error(result.error.message || 'Upload failed');
    }

    console.log('Upload successful:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

export const uploadProfileImageToCloudinary = async (imageUri: string): Promise<string> => {
  try {
    console.log('Starting profile image upload for:', imageUri);

    // Create FormData for upload
    const formData = new FormData();

    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `profile_${Date.now()}.jpg`,
    } as any);

    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('folder', 'profile_pictures');
    formData.append('upload_preset', 'waste_upload'); // Use the same preset

    console.log('FormData created, starting fetch...');

    // Upload to Cloudinary using direct API call
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    console.log('Fetch response status:', uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload response error:', errorText);

      // If preset doesn't exist, try without it
      if (errorText.includes('preset') || uploadResponse.status === 400) {
        console.log('Trying profile upload without preset...');

        const simpleFormData = new FormData();
        simpleFormData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: `profile_${Date.now()}.jpg`,
        } as any);
        simpleFormData.append('api_key', CLOUDINARY_API_KEY);
        simpleFormData.append('folder', 'profile_pictures');

        const retryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: simpleFormData,
          }
        );

        if (!retryResponse.ok) {
          const retryErrorText = await retryResponse.text();
          console.error('Retry profile upload failed:', retryErrorText);
          throw new Error(`Profile upload failed: ${retryResponse.status} - ${retryErrorText}`);
        }

        const retryResult = await retryResponse.json();
        if (retryResult.error) {
          throw new Error(retryResult.error.message || 'Profile upload failed');
        }

        console.log('Profile upload successful without preset:', retryResult.secure_url);
        return retryResult.secure_url;
      }

      throw new Error(`Profile upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const result = await uploadResponse.json();
    console.log('Profile upload result:', result);

    if (result.error) {
      throw new Error(result.error.message || 'Profile upload failed');
    }

    console.log('Profile upload successful:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading profile image to Cloudinary:', error);
    throw error;
  }
};