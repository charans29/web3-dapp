"use client"
import { useState } from "react";
import UploadImage from './UploadImage'
import { useRouter } from "next/router";
import axios from "axios";
import { BACKEND_URL } from "@/utils";

function Upload() {
    const [images, setImages] = useState<string[]>([]);
    const [title, setTitle] = useState("");
    const [txSignature, setTxSignature] = useState("");
    // const router = useRouter();

    async function onSubmit() {
        const response = await axios.post(`${BACKEND_URL}/v1/user/task`, {
            options: images.map(image => ({
                imageUrl: image,
            })),
            title,
            signature: txSignature
        }, {
            headers: {
                "Authorization": localStorage.getItem("token")
            }
        })

        // router.push(`/task/${response.data.id}`)
    }
  return (
    <div>
        <div className="flex justify-center text-blue-500 font-thin">
            <div className="max-w-screen-lg w-full">
                <div className="pl-4 text-2xl pt-10 w-full">
                    Create Task
                </div>
                <label className="pl-4 block mt-2 text-md text-gray-500">
                    Task Details
                </label>
                <input className="ml-4 mt-1 border border-blue-700 bg-gray-900 text-blue-300 text-sm rounded-lg
                                  w-full p-1.5" type='text' placeholder="what's your task?" 
                                  onChange={(e) => {
                                    setTitle(e.target.value);
                                    }}/>
                <label className="pl-4 block mt-5">
                    Add Images
                </label>
                <div className="ml-4 pt-2 flex justify-center">
                    {images.map(image => <UploadImage image={image} onImageAdded={(imageUrl) => {
                        setImages(i => [...i, imageUrl]);
                        }} />)}
                </div>
            </div>
        </div>
        <UploadImage onImageAdded={(imageUrl) => {
            setImages(i => [...i, imageUrl]);
            }} />
        <div className="flex justify-center">
            <button className="mt-4  text-blue-500 bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
            onClick={onSubmit} type="button">submit</button>
        </div>
    </div>
  )
}

export default Upload