"use client"

import { BACKEND_URL, CLOUDFRONT_URL } from '@/utils';
import axios from 'axios';
import { useState } from 'react';

type UploadImageProps = {
    onImageAdded: (image: string) => void;
    image?: string;
};

function UploadImage({ onImageAdded, image }: UploadImageProps) {
    const [uploading, setUploading] = useState(false);

    async function onFileSelect(e: any) {
        setUploading(true);
        try {
            const file = e.target.files[0];
            const response = await axios.get(`${BACKEND_URL}/v1/user/presignedUrl`, {
                headers: {
                    "Authorization": localStorage.getItem("token") || ""
                }
            });

            const presignedUrl = response.data.preSignedUrl;
            const formData = new FormData();
            
            formData.set("Policy", response.data.fields["Policy"]);
            formData.set("bucket", response.data.fields["bucket"]);
            formData.set("X-Amz-Signature", response.data.fields["X-Amz-Signature"]);
            formData.set("X-Amz-Algorithm", response.data.fields["X-Amz-Algorithm"]);
            formData.set("X-Amz-Credential", response.data.fields["X-Amz-Credential"]);
            formData.set("key", response.data.fields["key"]);
            formData.set("Content-Type", response.data.fields["Content-Type"]);
            formData.set("X-Amz-Date", response.data.fields["X-Amz-Date"]);
            formData.append("file", file);

            await axios.post(presignedUrl, formData);

            onImageAdded(`${CLOUDFRONT_URL}/${response.data.fields["key"]}`);
        } catch (e) {
            console.log(e);
        }
        setUploading(false);
    }

    if (image) {
        return <img className="p-2 w-96 rounded" src={image} />;
    }

    return (
        <div className="flex justify-center pt-10"> 
            <div className="w-40 h-40 rounded border border-blue-700 text-2xl">
                <div className="h-full flex justify-center w-full">
                    <div className="h-full flex justify-center flex-col">
                        {uploading ? <label className="text-sm">Loading...</label> : <>
                        <label style={{color: "green"}} className="cursor-pointer">+
                            <input className="opacity-0 absolute cursor-pointer" type='file' onChange={onFileSelect} />
                        </label> 
                        </>}
                    </div> 
                </div> 
            </div> 
        </div>
    );
}

export default UploadImage;
