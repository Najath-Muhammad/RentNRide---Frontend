import { api } from "./axios";

export const getUploadUrls = async (fileName: string,fileType: string) => {
  
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;
  
    const response = await api.post('/files/generate-upload-url',{
        fileName: uniqueFileName,
        fileType,
      }
    );
    console.log('response data',response.data)
  
    return response.data;
  };


  export const uploadToS3 = async (file: File): Promise<string> => {
    try {
      const { uploadUrl, publicUrl } = await getUploadUrls(file.name, file.type);
  
      // Make sure uploadUrl is a string
      if (typeof uploadUrl !== 'string') {
        throw new Error('Invalid upload URL');
      }
  
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });
  
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }
  
      return publicUrl;
  
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };
  

