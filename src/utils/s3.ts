import { api } from "./axios";

export const getUploadUrls = async (fileName: string,fileType: string) => {
  
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;
  
    const {data} = await api.post('/files/generate-upload-url',{
        fileName: uniqueFileName,
        fileType,
      }
    );
    console.log('response data',data)
  
    return data.data  
  };


  export const uploadToS3 = async (file: File): Promise<string> => {
    try {
      console.log('this is working')
      const { uploadUrl, publicUrl } = await getUploadUrls(file.name, file.type);
      console.log('this is working 2')

      console.log(typeof uploadUrl,uploadUrl)

      if (typeof uploadUrl !== 'string') {
        throw new Error('Invalid upload URL');
      }
  
      console.log('Uploading to:', uploadUrl.substring(0, 150) + '...'); 
      console.log('Sending Content-Type:', file.type || 'application/octet-stream');
  
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });
  
      if (!uploadResponse.ok) {
        const errorBody = await uploadResponse.text();
        console.error('S3 PUT failed!');
        console.error('Status:', uploadResponse.status);
        console.error('Response body:', errorBody);
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorBody.slice(0, 400)}`);
      }
  
      console.log('Upload success!');
      return publicUrl;
  
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

